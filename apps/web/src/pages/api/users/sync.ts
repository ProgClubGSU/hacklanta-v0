import type { APIRoute } from 'astro'
import { createServerSupabaseClient } from '../../../lib/supabase-server'

export const POST: APIRoute = async ({ locals }) => {
  const { isAuthenticated, userId } = locals.auth()

  if (!isAuthenticated || !userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Fetch user data from Clerk
  const clerkSecretKey = import.meta.env.CLERK_SECRET_KEY
  const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${clerkSecretKey}` },
  })

  if (!clerkRes.ok) {
    return new Response(JSON.stringify({ error: 'Failed to fetch user from Clerk' }), { status: 500 })
  }

  const clerkUser = await clerkRes.json()
  const email = clerkUser.email_addresses?.[0]?.email_address

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        clerk_id: userId,
        email,
        first_name: clerkUser.first_name ?? null,
        last_name: clerkUser.last_name ?? null,
        avatar_url: clerkUser.image_url ?? null,
      },
      { onConflict: 'clerk_id' }
    )
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ status: 'synced', user_id: data.id, email: data.email }))
}
