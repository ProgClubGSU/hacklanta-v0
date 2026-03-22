import type { APIRoute } from 'astro'
import { createServerSupabaseClient } from '../../../lib/supabase-server'

const APP_FIELDS = 'id, status, university, major, year_of_study, experience_level, created_at, reviewed_at'

export const GET: APIRoute = async ({ locals }) => {
  const { isAuthenticated, userId } = locals.auth()

  if (!isAuthenticated || !userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createServerSupabaseClient()

  // Find user by Clerk ID
  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('clerk_id', userId)
    .single()

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found', step: 'user_lookup' }), { status: 404 })
  }

  // 1. Try by user_id (already linked)
  const { data: apps } = await supabase
    .from('applications')
    .select(APP_FIELDS)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  let application = apps?.[0] ?? null

  // 2. Fallback: try matching by Supabase user email
  if (!application) {
    const { data: apps2 } = await supabase
      .from('applications')
      .select(APP_FIELDS)
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .limit(1)
    application = apps2?.[0] ?? null
  }

  // 3. Fallback: try matching by ALL Clerk email addresses
  if (!application) {
    const clerkSecretKey = import.meta.env.CLERK_SECRET_KEY
    if (clerkSecretKey) {
      const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: { Authorization: `Bearer ${clerkSecretKey}` },
      })
      if (clerkRes.ok) {
        const clerkUser = await clerkRes.json()
        const allEmails: string[] = (clerkUser.email_addresses ?? []).map(
          (e: { email_address: string }) => e.email_address
        )
        if (allEmails.length > 0) {
          const { data: apps3 } = await supabase
            .from('applications')
            .select(APP_FIELDS)
            .in('email', allEmails)
            .order('created_at', { ascending: false })
            .limit(1)
          application = apps3?.[0] ?? null
        }
      }
    }
  }

  if (!application) {
    return new Response(JSON.stringify({ error: 'No application found', step: 'app_lookup', user_id: user.id }), { status: 404 })
  }

  // Auto-link application to user if not already linked
  await supabase
    .from('applications')
    .update({ user_id: user.id })
    .eq('id', application.id)
    .is('user_id', null)

  return new Response(JSON.stringify(application))
}
