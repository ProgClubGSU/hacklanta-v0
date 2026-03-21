import type { APIRoute } from 'astro'
import { createServerSupabaseClient } from '../../../lib/supabase-server'

export const GET: APIRoute = async ({ locals }) => {
  const { isAuthenticated, userId } = locals.auth()

  if (!isAuthenticated || !userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createServerSupabaseClient()

  // Find user by Clerk ID
  const { data: user } = await supabase
    .from('users')
    .select('id, email, first_name, last_name')
    .eq('clerk_id', userId)
    .single()

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
  }

  const appFields = 'id, status, university, major, year_of_study, experience_level, created_at, reviewed_at'

  // 1. Try by user_id (already linked)
  let { data: application } = await supabase
    .from('applications')
    .select(appFields)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // 2. Fallback: try matching by email
  if (!application) {
    const result = await supabase
      .from('applications')
      .select(appFields)
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    application = result.data
  }

  // 3. Fallback: try matching by Clerk email addresses (user may have multiple)
  if (!application) {
    const clerkSecretKey = import.meta.env.CLERK_SECRET_KEY
    if (clerkSecretKey) {
      const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: { Authorization: `Bearer ${clerkSecretKey}` },
      })
      if (clerkRes.ok) {
        const clerkUser = await clerkRes.json()
        const allEmails = (clerkUser.email_addresses ?? []).map(
          (e: { email_address: string }) => e.email_address
        )
        if (allEmails.length > 0) {
          const result = await supabase
            .from('applications')
            .select(appFields)
            .in('email', allEmails)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
          application = result.data
        }
      }
    }
  }

  // Link application to user if found by fallback
  if (application) {
    const { data: linked } = await supabase
      .from('applications')
      .select('user_id')
      .eq('id', application.id)
      .single()
    if (linked && !linked.user_id) {
      await supabase
        .from('applications')
        .update({ user_id: user.id })
        .eq('id', application.id)
    }
  }

  if (!application) {
    return new Response(JSON.stringify({ error: 'No application found' }), { status: 404 })
  }

  return new Response(JSON.stringify(application))
}
