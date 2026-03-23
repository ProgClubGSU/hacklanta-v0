import type { APIRoute } from 'astro'
import { verifyAdmin } from '../../../lib/admin'
import { createServerSupabaseClient } from '../../../lib/supabase-server'
import { createResendClient, sendBatchEmails } from '../../../lib/emails/send'
import { templates, STATUS_TEMPLATE_MAP } from '../../../lib/emails/templates-minimal'

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

  console.log('[update-status] Request:', JSON.stringify({ new_status, send_email, application_ids_count: application_ids?.length, user_ids_count: user_ids?.length }))

  if ((!Array.isArray(application_ids) || application_ids.length === 0) &&
      (!Array.isArray(user_ids) || user_ids.length === 0)) {
    return new Response(JSON.stringify({ error: 'application_ids or user_ids must be a non-empty array' }), { status: 400 })
  }
  if (!VALID_STATUSES.includes(new_status)) {
    return new Response(JSON.stringify({ error: `new_status must be one of: ${VALID_STATUSES.join(', ')}` }), { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const now = new Date().toISOString()

  // --- Collect all application IDs ---
  const allAppIds = [...(application_ids ?? [])]

  if (Array.isArray(user_ids) && user_ids.length > 0) {
    const { data: existingApps } = await supabase
      .from('applications')
      .select('id, user_id')
      .in('user_id', user_ids)

    const usersWithApps = new Set((existingApps ?? []).map(a => a.user_id))
    allAppIds.push(...(existingApps ?? []).map(a => a.id))

    const usersWithoutApps = user_ids.filter((uid: string) => !usersWithApps.has(uid))
    if (usersWithoutApps.length > 0) {
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
        }
      }
    }

    if (new_status === 'accepted' || new_status === 'accepted_overflow') {
      await supabase
        .from('users')
        .update({ is_accepted: true })
        .in('id', user_ids)
    }
  }

  // --- Update application statuses ---
  const uniqueAppIds = [...new Set(allAppIds)]
  if (uniqueAppIds.length > 0) {
    const { error: updateError } = await supabase
      .from('applications')
      .update({ status: new_status, reviewed_at: now, reviewed_by: null })
      .in('id', uniqueAppIds)

    if (updateError) {
      console.error('[update-status] Failed to update applications:', updateError.message)
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
    }
  }

  // --- Set is_accepted for accepted statuses ---
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

  // --- Send emails ---
  let emailsSent = 0
  let emailsFailed = 0
  let emailError: string | null = null
  let emailErrorDetails: Array<{ email: string; error: string }> = []

  if (send_email) {
    const templateName = STATUS_TEMPLATE_MAP[new_status]
    if (!templateName) {
      emailError = `No email template exists for status "${new_status}"`
      console.warn('[update-status]', emailError)
    } else {
      // Fetch applications with user data — use !user_id to disambiguate FK
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('email, user_id, users!user_id(email, first_name)')
        .in('id', uniqueAppIds)

      if (appsError) {
        emailError = `Failed to fetch application data for emails: ${appsError.message}`
        console.error('[update-status]', emailError)
      } else if (!apps?.length) {
        emailError = `No applications found for IDs: ${uniqueAppIds.join(', ')}`
        console.error('[update-status]', emailError)
      } else {
        const emails = apps.map(app => {
          const user = (app as any).users
          const recipientEmail = user?.email ?? app.email
          if (!recipientEmail) {
            console.warn('[update-status] No email address for application, user_id:', app.user_id)
            return null
          }
          return { to: recipientEmail, ...templates[templateName]({ firstName: user?.first_name ?? null }) }
        }).filter((e): e is NonNullable<typeof e> => e !== null)

        if (emails.length === 0) {
          emailError = 'All applications were missing email addresses'
          console.error('[update-status]', emailError)
        } else {
          const result = await sendBatchEmails(createResendClient(), emails)
          emailsSent = result.sent
          emailsFailed = result.errors
          emailErrorDetails = result.errorDetails

          // Mark acceptance_sent_at for accepted users
          if (new_status === 'accepted' || new_status === 'accepted_overflow') {
            const userIds = apps.map(a => a.user_id).filter(Boolean)
            if (userIds.length > 0) {
              await supabase
                .from('users')
                .update({ acceptance_sent_at: now })
                .in('id', userIds)
            }
          }
        }
      }
    }
  }

  console.log('[update-status] Done:', JSON.stringify({ updated: uniqueAppIds.length, emails_sent: emailsSent, emails_failed: emailsFailed, email_error: emailError }))

  return new Response(JSON.stringify({
    updated: uniqueAppIds.length,
    emails_sent: emailsSent,
    emails_failed: emailsFailed,
    ...(emailError ? { email_error: emailError } : {}),
    ...(emailErrorDetails.length > 0 ? { email_error_details: emailErrorDetails } : {}),
  }))
}
