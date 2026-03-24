import type { APIRoute } from 'astro'
import { verifyAdmin } from '../../../lib/admin'
import { createServerSupabaseClient } from '../../../lib/supabase-server'

const ALL_STATUSES = ['pending', 'accepted', 'accepted_overflow', 'confirmed', 'confirmed_overflow', 'rejected', 'waitlisted']

export const GET: APIRoute = async ({ locals }) => {
  if (!import.meta.env.DEV) {
    const auth = await verifyAdmin(locals)
    if (!auth.authorized) return auth.response
  }

  const supabase = createServerSupabaseClient()

  // Run all count queries in parallel
  const [
    totalResult,
    ...statusResults
  ] = await Promise.all([
    // Total applications
    supabase
      .from('applications')
      .select('id', { count: 'exact', head: true }),

    // Count per status
    ...ALL_STATUSES.map(status =>
      supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('status', status)
    ),
  ])

  // Additional counts
  const [teamsResult, acceptedUsersResult, emailsSentResult] = await Promise.all([
    supabase
      .from('teams')
      .select('id', { count: 'exact', head: true }),

    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('is_accepted', true),

    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .not('acceptance_sent_at', 'is', null),
  ])

  // Check for errors
  const allResults = [totalResult, ...statusResults, teamsResult, acceptedUsersResult, emailsSentResult]
  const firstError = allResults.find(r => r.error)
  if (firstError?.error) {
    return new Response(JSON.stringify({ error: firstError.error.message }), { status: 500 })
  }

  // Build by_status map
  const by_status: Record<string, number> = {}
  ALL_STATUSES.forEach((status, i) => {
    by_status[status] = statusResults[i].count ?? 0
  })

  return new Response(JSON.stringify({
    total: totalResult.count ?? 0,
    by_status,
    teams_count: teamsResult.count ?? 0,
    accepted_users: acceptedUsersResult.count ?? 0,
    emails_sent: emailsSentResult.count ?? 0,
  }))
}
