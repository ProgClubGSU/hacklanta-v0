import type { APIRoute } from 'astro'
import { createServerSupabaseClient } from '../../../lib/supabase-server'

export const POST: APIRoute = async ({ locals }) => {
  const { isAuthenticated, userId } = locals.auth()

  if (!isAuthenticated || !userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Check admin role via Clerk
  const clerkSecretKey = import.meta.env.CLERK_SECRET_KEY
  const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${clerkSecretKey}` },
  })
  const clerkUser = await clerkRes.json()
  const role = clerkUser.public_metadata?.role ?? clerkUser.private_metadata?.role
  if (role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 })
  }

  const supabase = createServerSupabaseClient()

  let totalSynced = 0
  let totalSkipped = 0
  let totalErrors = 0
  let offset = 0
  const limit = 100

  // Page through all Clerk users
  while (true) {
    const res = await fetch(
      `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}&order_by=-created_at`,
      { headers: { Authorization: `Bearer ${clerkSecretKey}` } }
    )

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users from Clerk', status: res.status }),
        { status: 500 }
      )
    }

    const users = await res.json()
    if (!Array.isArray(users) || users.length === 0) break

    for (const user of users) {
      const email = user.email_addresses?.[0]?.email_address
      if (!email) {
        totalSkipped++
        continue
      }

      const { error } = await supabase.from('users').upsert(
        {
          clerk_id: user.id,
          email,
          first_name: user.first_name ?? null,
          last_name: user.last_name ?? null,
          avatar_url: user.image_url ?? null,
        },
        { onConflict: 'clerk_id' }
      )

      if (error) {
        totalErrors++
      } else {
        totalSynced++
      }
    }

    if (users.length < limit) break
    offset += limit
  }

  return new Response(
    JSON.stringify({ synced: totalSynced, skipped: totalSkipped, errors: totalErrors })
  )
}
