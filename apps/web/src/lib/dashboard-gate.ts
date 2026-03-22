import { createServerSupabaseClient } from './supabase-server'

// Cutoff: March 21, 2026 6:00 PM EDT (10:00 PM UTC — EDT is UTC-4, DST active)
// Accounts created after this have tally+clerk linking, so we verify they applied
const LINKING_CUTOFF = new Date('2026-03-21T22:00:00Z')

export type GateResult =
  | { status: 'accepted' }
  | { status: 'pending' }
  | { status: 'no-application' }

/**
 * Checks whether a user should be allowed into the dashboard.
 * Handles the webhook race condition by syncing the user from Clerk if needed.
 */
export async function checkDashboardAccess(clerkUserId: string): Promise<GateResult> {
  const supabase = createServerSupabaseClient()

  // Look up user in Supabase
  let { data: user } = await supabase
    .from('users')
    .select('id, is_accepted, created_at')
    .eq('clerk_id', clerkUserId)
    .maybeSingle()

  // Webhook race condition: user signed up but Clerk webhook hasn't fired yet
  // Sync the user from Clerk API so we have a record to work with
  if (!user) {
    const clerkSecretKey = import.meta.env.CLERK_SECRET_KEY
    if (clerkSecretKey) {
      const clerkRes = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
        headers: { Authorization: `Bearer ${clerkSecretKey}` },
      })

      if (clerkRes.ok) {
        const clerkUser = await clerkRes.json()
        const email = clerkUser.email_addresses?.[0]?.email_address

        const { data: synced } = await supabase
          .from('users')
          .upsert(
            {
              clerk_id: clerkUserId,
              email,
              first_name: clerkUser.first_name ?? null,
              last_name: clerkUser.last_name ?? null,
              avatar_url: clerkUser.image_url ?? null,
            },
            { onConflict: 'clerk_id' }
          )
          .select('id, is_accepted, created_at')
          .single()

        user = synced
      }
    }
  }

  // If we still can't find/create the user, treat as pending
  if (!user) {
    return { status: 'pending' }
  }

  if (user.is_accepted) {
    return { status: 'accepted' }
  }

  // Post-cutoff accounts: verify they actually have a linked application
  if (new Date(user.created_at) >= LINKING_CUTOFF) {
    const { data: application } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!application) {
      return { status: 'no-application' }
    }
  }

  return { status: 'pending' }
}
