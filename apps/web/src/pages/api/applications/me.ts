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
    .select('id, email')
    .eq('clerk_id', userId)
    .single()

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
  }

  // Find application by user_id or email
  let { data: application } = await supabase
    .from('applications')
    .select('id, status, university, major, year_of_study, experience_level, created_at, reviewed_at')
    .eq('user_id', user.id)
    .single()

  if (!application) {
    // Fallback: try matching by email
    const result = await supabase
      .from('applications')
      .select('id, status, university, major, year_of_study, experience_level, created_at, reviewed_at')
      .eq('email', user.email)
      .single()
    application = result.data

    // Link application to user if found
    if (application) {
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
