import type { APIRoute } from 'astro'
import { verifyAdmin } from '../../../lib/admin'
import { createServerSupabaseClient } from '../../../lib/supabase-server'
import { createResendClient, sendBatchEmails } from '../../../lib/emails/send'
import { templates, STATUS_TEMPLATE_MAP } from '../../../lib/emails/templates'

const VALID_STATUSES = ['pending', 'accepted', 'accepted_overflow', 'rejected', 'waitlisted']

export const POST: APIRoute = async ({ locals, request }) => {
  const auth = await verifyAdmin(locals)
  if (!auth.authorized) return auth.response

  let body: any
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const { application_ids, new_status, send_email = false } = body

  if (!Array.isArray(application_ids) || application_ids.length === 0) {
    return new Response(JSON.stringify({ error: 'application_ids must be a non-empty array' }), { status: 400 })
  }
  if (!VALID_STATUSES.includes(new_status)) {
    return new Response(JSON.stringify({ error: `new_status must be one of: ${VALID_STATUSES.join(', ')}` }), { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Update application statuses
  const { error: updateError, count } = await supabase
    .from('applications')
    .update({
      status: new_status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: null, // Could be set to admin's user ID if needed
    })
    .in('id', application_ids)

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
  }

  // If accepted/overflow, also set is_accepted on linked users
  if (new_status === 'accepted' || new_status === 'accepted_overflow') {
    const { data: apps } = await supabase
      .from('applications')
      .select('user_id')
      .in('id', application_ids)
      .not('user_id', 'is', null)

    const userIds = (apps ?? []).map(a => a.user_id).filter(Boolean)
    if (userIds.length > 0) {
      await supabase
        .from('users')
        .update({ is_accepted: true })
        .in('id', userIds)
    }
  }

  // Send emails if requested
  let emailsSent = 0
  let emailsFailed = 0

  if (send_email) {
    const templateName = STATUS_TEMPLATE_MAP[new_status]
    if (!templateName) {
      return new Response(JSON.stringify({
        updated: count ?? 0,
        emails_sent: 0,
        emails_failed: 0,
        error: `No email template for status "${new_status}"`,
      }))
    }

    // Fetch applications with user data for email personalization
    const { data: apps } = await supabase
      .from('applications')
      .select('email, user_id, users(email, first_name)')
      .in('id', application_ids)

    if (apps?.length) {
      const resend = createResendClient()
      const emails = apps.map(app => {
        const user = (app as any).users
        const recipientEmail = user?.email ?? app.email
        if (!recipientEmail) return null

        const template = templates[templateName]({ firstName: user?.first_name ?? null })
        return { to: recipientEmail, ...template }
      }).filter((e): e is NonNullable<typeof e> => e !== null)

      const result = await sendBatchEmails(resend, emails)
      emailsSent = result.sent
      emailsFailed = result.errors

      // Mark acceptance_sent_at for accepted users
      if (new_status === 'accepted' || new_status === 'accepted_overflow') {
        const userIds = apps.map(a => a.user_id).filter(Boolean)
        if (userIds.length > 0) {
          await supabase
            .from('users')
            .update({ acceptance_sent_at: new Date().toISOString() })
            .in('id', userIds)
        }
      }
    }
  }

  return new Response(JSON.stringify({
    updated: count ?? 0,
    emails_sent: emailsSent,
    emails_failed: emailsFailed,
  }))
}
