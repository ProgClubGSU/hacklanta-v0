import type { APIRoute } from 'astro'
import { createServerSupabaseClient } from '../../../lib/supabase-server'
import { createHmac } from 'node:crypto'

function verifyTallySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return !secret // skip verification if no secret configured
  const expected = createHmac('sha256', secret).update(body).digest('base64')
  return signature === expected
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
    const value = field.value ?? ''

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
      appData.resume_url = Array.isArray(value) ? value[0]?.url : value
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
    if (user) appData.user_id = user.id
  }

  // 2. Fallback: try matching by any email from the submission
  if (!appData.user_id) {
    const allEmails = [schoolEmail, personalEmail].filter(Boolean)
    for (const email of allEmails) {
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

  const { error } = await supabase.from('applications').upsert(appData, {
    onConflict: 'tally_response_id',
    ignoreDuplicates: true,
  })

  if (error) {
    if (error.code === '23505') {
      return new Response(JSON.stringify({ status: 'duplicate', response_id: responseId }), { status: 200 })
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ status: 'ok', response_id: responseId }), { status: 200 })
}
