import type { APIRoute } from 'astro'
import { createServerSupabaseClient } from '../../../lib/supabase-server'
import { createHmac } from 'node:crypto'

function verifyTallySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return !secret // skip verification if no secret configured
  const expected = createHmac('sha256', secret).update(body).digest('base64')
  return signature === expected
}

/** Extract a human-readable string from Tally's various field value formats */
function extractValue(field: { value: unknown; options?: Array<{ id: string; name: string }> }): string {
  const val = field.value
  if (val == null) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (Array.isArray(val)) {
    if (val.length === 0) return ''
    // Choice/dropdown fields: [{id, name}] — extract names
    if (typeof val[0] === 'object' && val[0]?.name) {
      return val.map((v: { name?: string }) => v.name ?? '').filter(Boolean).join(', ')
    }
    // Option ID arrays (plain strings) — resolve labels via field.options
    if (typeof val[0] === 'string' && field.options?.length) {
      return val.map((id: string) => {
        const opt = field.options!.find((o) => o.id === id)
        return opt?.name ?? id
      }).join(', ')
    }
    // File uploads: [{url, name}]
    if (typeof val[0] === 'object' && val[0]?.url) {
      return val[0].url
    }
    // Fallback: join plain values
    return val.map(String).join(', ')
  }
  if (typeof val === 'object' && val !== null) {
    return (val as { name?: string }).name ?? JSON.stringify(val)
  }
  return String(val)
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000) // 5s timeout
      const res = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timeout)
      if (res.ok) return res
    } catch {
      // retry
    }
  }
  return null
}

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.TALLY_SIGNING_SECRET ?? ''
  const body = await request.text()
  const signature = request.headers.get('tally-signature')

  if (!verifyTallySignature(body, signature, secret)) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
  }

  const payload = JSON.parse(body)
  if (payload.eventType !== 'FORM_RESPONSE') {
    return new Response(JSON.stringify({ status: 'ignored', reason: 'Not a form response' }), { status: 200 })
  }

  const responseId = payload.data?.responseId
  const fields = payload.data?.fields ?? []

  // Map Tally fields to application data
  const appData: Record<string, unknown> = {
    tally_response_id: responseId,
    status: 'pending',
  }

  let schoolEmail = ''
  let personalEmail = ''

  for (const field of fields) {
    const label = (field.label ?? '').toLowerCase()
    const value = extractValue(field)

    if (label.includes('first name')) { /* parsed but not stored separately */ }
    else if (label.includes('last name')) { /* parsed but not stored separately */ }
    else if (label.includes('school email')) schoolEmail = value
    else if (label.includes('personal email')) personalEmail = value
    else if (label.includes('phone')) appData.phone_number = value
    else if (label.includes('t-shirt')) appData.tshirt_size = value
    else if (label.includes('dietary')) appData.dietary_restrictions = value
    else if (label.includes('school') || label.includes('university')) appData.university = value
    else if (label.includes('major')) appData.major = value
    else if (label.includes('year of study')) appData.year_of_study = value
    else if (label.includes('graduation')) appData.graduation_date = value
    else if (label.includes('hackathon experience')) appData.experience_level = value
    else if (label.includes('resume')) {
      // Resume is a file upload — extractValue already handles [{url}]
      appData.resume_url = value
    }
    else if (label.includes('github')) appData.github_url = value
    else if (label.includes('linkedin')) appData.linkedin_url = value
    else if (label.includes('what excites')) appData.why_attend = value
    else if (label.includes('hear about')) appData.how_did_you_hear = value
  }

  // Clerk user ID passed as URL parameter from the embedded form
  const clerkId = payload.data?.urlParameters?.clerk_id ?? ''

  appData.email = schoolEmail || personalEmail
  appData.university = appData.university || 'N/A'
  appData.major = appData.major || 'N/A'
  appData.year_of_study = appData.year_of_study || 'N/A'

  const supabase = createServerSupabaseClient()

  // 1. Best: link directly via Clerk user ID (passed from logged-in apply page)
  if (clerkId) {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .limit(1)
      .single()
    if (user) {
      appData.user_id = user.id
    } else {
      // User not in DB yet (Clerk webhook race condition) — sync from Clerk API
      const clerkSecretKey = import.meta.env.CLERK_SECRET_KEY
      if (clerkSecretKey) {
        const clerkRes = await fetchWithRetry(
          `https://api.clerk.com/v1/users/${clerkId}`,
          { headers: { Authorization: `Bearer ${clerkSecretKey}` } }
        )
        if (clerkRes) {
          const clerkUser = await clerkRes.json()
          const clerkEmail = clerkUser.email_addresses?.[0]?.email_address
          if (clerkEmail) {
            const { data: synced } = await supabase
              .from('users')
              .upsert(
                {
                  clerk_id: clerkId,
                  email: clerkEmail,
                  first_name: clerkUser.first_name ?? null,
                  last_name: clerkUser.last_name ?? null,
                  avatar_url: clerkUser.image_url ?? null,
                },
                { onConflict: 'clerk_id' }
              )
              .select('id')
              .single()
            if (synced) appData.user_id = synced.id
          }
        }
      }
    }
  }

  // 2. Fallback: try matching by any email from the form submission
  if (!appData.user_id) {
    const formEmails = [schoolEmail, personalEmail].filter(Boolean)
    for (const email of formEmails) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .limit(1)
        .single()
      if (user) {
        appData.user_id = user.id
        break
      }
    }
  }

  // 3. Last resort: if we have clerk_id but still no link, try ALL Clerk emails
  if (!appData.user_id && clerkId) {
    const clerkSecretKey = import.meta.env.CLERK_SECRET_KEY
    if (clerkSecretKey) {
      const clerkRes = await fetchWithRetry(
        `https://api.clerk.com/v1/users/${clerkId}`,
        { headers: { Authorization: `Bearer ${clerkSecretKey}` } }
      )
      if (clerkRes) {
        const clerkUser = await clerkRes.json()
        const allClerkEmails: string[] = (clerkUser.email_addresses ?? []).map(
          (e: { email_address: string }) => e.email_address
        )
        for (const clerkEmail of allClerkEmails) {
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', clerkEmail)
            .limit(1)
            .single()
          if (user) {
            appData.user_id = user.id
            break
          }
        }
      }
    }
  }

  // If clerk_id was provided but we still couldn't link, reject the webhook
  // so Tally retries. This guarantees 100% linking for logged-in submissions.
  if (clerkId && !appData.user_id) {
    console.error(`[tally-webhook] REJECTING: Failed to link application to user. clerk_id=${clerkId}, email=${appData.email}, tally_response_id=${responseId}`)
    return new Response(
      JSON.stringify({ error: 'Could not link to user, will retry', clerk_id: clerkId }),
      { status: 503 }
    )
  }

  const { error } = await supabase.from('applications').upsert(appData, {
    onConflict: 'tally_response_id',
    ignoreDuplicates: false,
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ status: 'ok', response_id: responseId }), { status: 200 })
}
