import type { APIRoute } from 'astro'
import { createServerSupabaseClient } from '../../../lib/supabase-server'
import { Resend } from 'resend'

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

  const resendApiKey = import.meta.env.RESEND_API_KEY
  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 })
  }

  const resend = new Resend(resendApiKey)
  const supabase = createServerSupabaseClient()

  // Find accepted applicants who haven't been sent acceptance emails yet.
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, first_name, applications!inner(status)')
    .is('acceptance_sent_at', null)
    .eq('applications.status', 'accepted')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let sent = 0
  let errors = 0

  for (const user of users ?? []) {
    try {
      await resend.emails.send({
        from: 'Hacklanta <noreply@hacklanta.dev>',
        to: user.email,
        subject: "Hacklanta — You're In!",
        html: `<p>Hey ${user.first_name ?? 'there'}! You've been accepted to Hacklanta. Log in at hacklanta.dev to find a team.</p>`,
      })
      await supabase
        .from('users')
        .update({ acceptance_sent_at: new Date().toISOString() })
        .eq('id', user.id)
      sent++
    } catch {
      errors++
    }
  }

  return new Response(JSON.stringify({ sent, errors, total: users?.length ?? 0 }))
}
