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

  const { application_ids, user_ids, new_status, send_email = false } = body

  if ((!Array.isArray(application_ids) || application_ids.length === 0) &&
      (!Array.isArray(user_ids) || user_ids.length === 0)) {
    return new Response(JSON.stringify({ error: 'application_ids or user_ids must be a non-empty array' }), { status: 400 })
  }
  if (!VALID_STATUSES.includes(new_status)) {
    return new Response(JSON.stringify({ error: `new_status must be one of: ${VALID_STATUSES.join(', ')}` }), { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const now = new Date().toISOString()
  let totalUpdated = 0

  // If user_ids provided, create stub applications for users that don't have one
  // and collect their application IDs for the status update
  const allAppIds = [...(application_ids ?? [])]

  if (Array.isArray(user_ids) && user_ids.length > 0) {
    // Find which users already have applications
    const { data: existingApps } = await supabase
      .from('applications')
      .select('id, user_id')
      .in('user_id', user_ids)

    const usersWithApps = new Set((existingApps ?? []).map(a => a.user_id))
    const existingAppIds = (existingApps ?? []).map(a => a.id)
    allAppIds.push(...existingAppIds)

    // Create stub applications for users without one
    const usersWithoutApps = user_ids.filter((uid: string) => !usersWithApps.has(uid))
    if (usersWithoutApps.length > 0) {
      // Fetch user details for the stub applications
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', usersWithoutApps)

      if (users?.length) {
        const stubs = users.map(u => ({
          user_id: u.id,
          email: u.email,
          status: new_status,
          university: 'N/A',
          major: 'N/A',
          year_of_study: 'N/A',
          reviewed_at: now,
        }))
        const { data: inserted } = await supabase
          .from('applications')
          .insert(stubs)
          .select('id')
        if (inserted) {
          allAppIds.push(...inserted.map(a => a.id))
          totalUpdated += inserted.length
        }
      }
    }

    // Also update is_accepted directly on users table
    if (new_status === 'accepted' || new_status === 'accepted_overflow') {
      await supabase
        .from('users')
        .update({ is_accepted: true })
        .in('id', user_ids)
    }
  }

  // Update application statuses (for both existing and newly created)
  const uniqueAppIds = [...new Set(allAppIds)]
  if (uniqueAppIds.length > 0) {
    const { error: updateError, count } = await supabase
      .from('applications')
      .update({
        status: new_status,
        reviewed_at: now,
        reviewed_by: null,
      })
      .in('id', uniqueAppIds)

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
    }
    totalUpdated += (count ?? 0)
  }

  // If accepted/overflow, also set is_accepted on linked users (from application_ids path)
  if (new_status === 'accepted' || new_status === 'accepted_overflow') {
    const { data: apps } = await supabase
      .from('applications')
      .select('user_id')
      .in('id', uniqueAppIds)
      .not('user_id', 'is', null)

    const linkedUserIds = (apps ?? []).map(a => a.user_id).filter(Boolean)
    if (linkedUserIds.length > 0) {
      await supabase
        .from('users')
        .update({ is_accepted: true })
        .in('id', linkedUserIds)
    }
  }

  // Send emails if requested
  let emailsSent = 0
  let emailsFailed = 0

  if (send_email) {
    console.log('[update-status] send_email=true, new_status=', new_status)
    const templateName = STATUS_TEMPLATE_MAP[new_status]
    if (!templateName) {
      console.warn('[update-status] No email template for status:', new_status)
      return new Response(JSON.stringify({
        updated: totalUpdated,
        emails_sent: 0,
        emails_failed: 0,
        error: `No email template for status "${new_status}"`,
      }))
    }

    // Fetch applications with user data for email personalization
    const { data: apps, error: appsError } = await supabase
      .from('applications')
      .select('email, user_id, users(email, first_name)')
      .in('id', uniqueAppIds)

    console.log('[update-status] apps query result:', { count: apps?.length ?? 0, error: appsError?.message ?? null })

    if (apps?.length) {
      const resend = createResendClient()
      const emails = apps.map(app => {
        const user = (app as any).users
        const recipientEmail = user?.email ?? app.email
        if (!recipientEmail) {
          console.warn('[update-status] No email for app, skipping:', { user_id: app.user_id, app_email: app.email })
          return null
        }

        const template = templates[templateName]({ firstName: user?.first_name ?? null })
        return { to: recipientEmail, ...template }
      }).filter((e): e is NonNullable<typeof e> => e !== null)

      console.log('[update-status] Sending', emails.length, 'emails via Resend')

      const result = await sendBatchEmails(resend, emails)
      emailsSent = result.sent
      emailsFailed = result.errors

      console.log('[update-status] Resend result:', { sent: result.sent, errors: result.errors, errorDetails: result.errorDetails })

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
    } else {
      console.warn('[update-status] No apps found for email sending, uniqueAppIds:', uniqueAppIds)
    }
  } else {
    console.log('[update-status] send_email=false, skipping email')
  }

  return new Response(JSON.stringify({
    updated: totalUpdated,
    emails_sent: emailsSent,
    emails_failed: emailsFailed,
  }))
}
