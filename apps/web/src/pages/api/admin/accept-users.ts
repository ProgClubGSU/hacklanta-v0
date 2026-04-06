import type { APIRoute } from 'astro'
import { verifyAdmin } from '../../../lib/admin'
import { createServerSupabaseClient } from '../../../lib/supabase-server'
import { createResendClient, sendBatchEmails } from '../../../lib/emails/send'
import { templates } from '../../../lib/emails/templates'

export const POST: APIRoute = async ({ locals }) => {
  const auth = await verifyAdmin(locals)
  if (!auth.authorized) return auth.response

  const supabase = createServerSupabaseClient()

  // Find accepted applicants (including overflow) who haven't been sent acceptance emails yet.
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, first_name, applications!user_id!inner(status)')
    .is('acceptance_sent_at', null)
    .in('applications.status', ['accepted', 'accepted_overflow'])

  if (error) {
    console.error('[accept-users] Supabase query failed:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!users?.length) {
    console.log('[accept-users] No pending acceptance emails to send')
    return new Response(JSON.stringify({ sent: 0, errors: 0, total: 0 }))
  }

  console.log(`[accept-users] Found ${users.length} user(s) to email`)

  // Build email payloads using templates
  const emails = users.map(user => {
    const isOverflow = (user as Record<string, unknown> & { applications?: Array<{ status: string }> }).applications?.[0]?.status === 'accepted_overflow'
    const template = isOverflow
      ? templates.acceptance_overflow({ firstName: user.first_name })
      : templates.acceptance({ firstName: user.first_name })
    return { to: user.email, ...template }
  })

  const resend = createResendClient()
  const result = await sendBatchEmails(resend, emails)

  // Bulk update all users as accepted
  await supabase
    .from('users')
    .update({ is_accepted: true, acceptance_sent_at: new Date().toISOString() })
    .in('id', users.map(u => u.id))

  console.log('[accept-users] Done:', JSON.stringify(result))

  return new Response(JSON.stringify(result))
}
