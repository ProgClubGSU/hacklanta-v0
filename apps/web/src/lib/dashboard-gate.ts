import { createServerSupabaseClient } from './supabase-server'

export type GateResult =
  | { status: 'confirmed' }
  | { status: 'accepted' }
  | { status: 'pending' }

/**
 * Checks whether a user should be allowed into the dashboard.
 * Handles the webhook race condition by syncing the user from Clerk if needed.
 */
export async function checkDashboardAccess(clerkUserId: string): Promise<GateResult> {
  const supabase = createServerSupabaseClient()

  // Look up user in Supabase
  let { data: user } = await supabase
    .from('users')
    .select('id, is_accepted, is_confirmed, created_at')
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
          .select('id, is_accepted, is_confirmed, created_at')
          .single()

        user = synced
      } else {
        console.warn(
          `[dashboard-gate] Clerk API sync failed for ${clerkUserId}: ${clerkRes.status} ${clerkRes.statusText}`
        )
      }
    } else {
      console.warn('[dashboard-gate] Missing CLERK_SECRET_KEY, cannot sync user from Clerk')
    }
  }

  // If we still can't find/create the user, treat as pending
  if (!user) {
    return { status: 'pending' }
  }

  if (user.is_confirmed) {
    return { status: 'confirmed' }
  }

  if (user.is_accepted) {
    return { status: 'accepted' }
  }

  return { status: 'pending' }
}
