import type { APIRoute } from 'astro'
import { verifyAdmin } from '../../../lib/admin'
import { createServerSupabaseClient } from '../../../lib/supabase-server'
import { createResendClient, sendBatchEmails } from '../../../lib/emails/send'
import { templates } from '../../../lib/emails/templates'

interface SegmentFilter {
  status?: string[]
  university?: string
  experience_level?: string[]
  year_of_study?: string[]
  is_accepted?: boolean
}

export const POST: APIRoute = async ({ locals, request }) => {
  const auth = await verifyAdmin(locals)
  if (!auth.authorized) return auth.response

  let body: any
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const { subject, body: emailBody, filters = {}, dry_run = false } = body

  if (!subject || typeof subject !== 'string') {
    return new Response(JSON.stringify({ error: 'subject is required' }), { status: 400 })
  }
  if (!emailBody || typeof emailBody !== 'string') {
    return new Response(JSON.stringify({ error: 'body is required' }), { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const segmentFilters: SegmentFilter = filters

  // Build segmentation query
  // Use left join by default so unlinked applicants are included.
  // Use inner join only when filtering on users-table columns (is_accepted).
  const joinType = segmentFilters.is_accepted !== undefined ? '!inner' : '!left'
  let query = supabase
    .from('applications')
    .select(`email, users${joinType}(email, first_name)`)

  if (segmentFilters.status?.length) {
    query = query.in('status', segmentFilters.status)
  }
  if (segmentFilters.university) {
    query = query.ilike('university', `%${segmentFilters.university}%`)
  }
  if (segmentFilters.experience_level?.length) {
    query = query.in('experience_level', segmentFilters.experience_level)
  }
  if (segmentFilters.year_of_study?.length) {
    query = query.in('year_of_study', segmentFilters.year_of_study)
  }
  if (segmentFilters.is_accepted !== undefined) {
    query = query.eq('users.is_accepted', segmentFilters.is_accepted)
  }

  const { data: rows, error } = await query

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // Deduplicate by email address
  const recipientMap = new Map<string, { email: string; firstName: string | null }>()
  for (const row of rows ?? []) {
    const user = (row as any).users
    const email = (user?.email ?? row.email)?.toLowerCase()
    if (!email) continue
    if (!recipientMap.has(email)) {
      recipientMap.set(email, { email, firstName: user?.first_name ?? null })
    }
  }

  const recipients = Array.from(recipientMap.values())

  // Dry run: return count and sample emails
  if (dry_run) {
    return new Response(JSON.stringify({
      dry_run: true,
      recipient_count: recipients.length,
      sample_emails: recipients.slice(0, 10).map(r => r.email),
    }))
  }

  // Safety limit
  if (recipients.length > 1000) {
    return new Response(JSON.stringify({
      error: `Too many recipients (${recipients.length}). Narrow your filters or contact an engineer to raise the limit.`,
    }), { status: 400 })
  }

  // Build and send emails
  const resend = createResendClient()
  const emails = recipients.map(r => {
    const template = templates.announcement({
      firstName: r.firstName,
      subject,
      body: emailBody,
    })
    return { to: r.email, ...template }
  })

  const result = await sendBatchEmails(resend, emails)

  return new Response(JSON.stringify({
    dry_run: false,
    ...result,
  }))
}
