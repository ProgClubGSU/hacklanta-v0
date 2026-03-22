import type { APIContext } from 'astro'

type AdminAuthResult =
  | { authorized: true; userId: string }
  | { authorized: false; response: Response }

export async function verifyAdmin(locals: APIContext['locals']): Promise<AdminAuthResult> {
  const { isAuthenticated, userId } = locals.auth()

  if (!isAuthenticated || !userId) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    }
  }

  const clerkSecretKey = import.meta.env.CLERK_SECRET_KEY
  const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${clerkSecretKey}` },
  })
  const clerkUser = await clerkRes.json()
  const role = clerkUser.public_metadata?.role ?? clerkUser.private_metadata?.role

  if (role !== 'admin') {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 }),
    }
  }

  return { authorized: true, userId }
}
