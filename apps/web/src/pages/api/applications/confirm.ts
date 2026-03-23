import type { APIRoute } from 'astro'
import { createServerSupabaseClient } from '../../../lib/supabase-server'

const CONFIRMATION_THRESHOLD = 300
const OVERALL_CAP = 450

export const POST: APIRoute = async ({ locals }) => {
  const { isAuthenticated, userId: clerkUserId } = locals.auth()

  if (!isAuthenticated || !clerkUserId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createServerSupabaseClient()

  // Resolve Clerk ID to internal user
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .single()

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
  }

  // Fetch application
  const { data: application } = await supabase
    .from('applications')
    .select('id, status, university, major')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!application) {
    return new Response(JSON.stringify({ error: 'No application found' }), { status: 404 })
  }

  // Idempotent: already confirmed
  if (application.status === 'confirmed' || application.status === 'confirmed_overflow') {
    return new Response(JSON.stringify({ result: 'already_confirmed' }))
  }

  // Must be accepted or accepted_overflow
  if (application.status !== 'accepted' && application.status !== 'accepted_overflow') {
    return new Response(JSON.stringify({ error: 'Application is not in an accepted state' }), { status: 400 })
  }

  // Validate profile completeness
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio, linkedin_url, discord_username')
    .eq('user_id', user.id)
    .single()

  const missing: string[] = []
  if (!profile?.display_name?.trim()) missing.push('display_name')
  if (!profile?.bio?.trim()) missing.push('bio')
  if (!profile?.linkedin_url?.trim()) missing.push('linkedin_url')
  if (!profile?.discord_username?.trim()) missing.push('discord_username')

  if (missing.length > 0) {
    return new Response(JSON.stringify({ error: 'incomplete_profile', missing }), { status: 400 })
  }

  // Count current confirmations
  const { count: confirmedCount } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .in('status', ['confirmed', 'confirmed_overflow'])

  const currentCount = confirmedCount ?? 0

  // Cap reached — waitlist the user
  if (currentCount >= OVERALL_CAP) {
    await supabase
      .from('applications')
      .update({ status: 'waitlisted' })
      .eq('id', application.id)

    return new Response(JSON.stringify({ result: 'waitlisted' }))
  }

  // Confirm the user
  const newStatus = application.status === 'accepted_overflow' ? 'confirmed_overflow' : 'confirmed'
  const now = new Date().toISOString()

  await supabase
    .from('applications')
    .update({ status: newStatus, confirmed_at: now })
    .eq('id', application.id)

  // Mark user as confirmed (gates team finder access via RLS)
  await supabase
    .from('users')
    .update({ is_confirmed: true })
    .eq('id', user.id)

  // Overflow sweep: if we just crossed the 300 threshold, convert remaining accepted -> accepted_overflow
  if (currentCount < CONFIRMATION_THRESHOLD && currentCount + 1 >= CONFIRMATION_THRESHOLD) {
    await supabase
      .from('applications')
      .update({ status: 'accepted_overflow' })
      .eq('status', 'accepted')
  }

  // Auto-populate university + major on profile
  if (application.university || application.major) {
    const profileUpdate: Record<string, string> = {}
    if (application.university) profileUpdate.university = application.university
    if (application.major) profileUpdate.major = application.major

    await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('user_id', user.id)
  }

  return new Response(JSON.stringify({ result: newStatus }))
}
