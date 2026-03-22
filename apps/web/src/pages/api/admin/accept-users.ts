import type { APIRoute } from 'astro'
import { verifyAdmin } from '../../../lib/admin'
import { createServerSupabaseClient } from '../../../lib/supabase-server'
import { createResendClient, sendBatchEmails } from '../../../lib/emails/send'
import { templates } from '../../../lib/emails/templates'

export const POST: APIRoute = async ({ locals }) => {
  const auth = await verifyAdmin(locals)
  if (!auth.authorized) return auth.response

  const resend = createResendClient()
  const supabase = createServerSupabaseClient()

  // Find accepted applicants (including overflow) who haven't been sent acceptance emails yet.
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, first_name, applications!inner(status)')
    .is('acceptance_sent_at', null)
    .in('applications.status', ['accepted', 'accepted_overflow'])

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!users?.length) {
    return new Response(JSON.stringify({ sent: 0, errors: 0, total: 0 }))
  }

  // Build email payloads using templates
  const emails = users.map(user => {
    const isOverflow = (user as any).applications?.[0]?.status === 'accepted_overflow'
    const template = isOverflow
      ? templates.acceptance_overflow({ firstName: user.first_name })
      : templates.acceptance({ firstName: user.first_name })
    return { to: user.email, ...template }
  })

  const result = await sendBatchEmails(resend, emails)

  // Bulk update all users as accepted
  await supabase
    .from('users')
    .update({ is_accepted: true, acceptance_sent_at: new Date().toISOString() })
    .in('id', users.map(u => u.id))

  return new Response(JSON.stringify(result))
}
