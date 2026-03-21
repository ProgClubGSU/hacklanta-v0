import type { APIRoute } from 'astro'
import { Webhook } from 'svix'
import { createServerSupabaseClient } from '../../../lib/supabase-server'

export const POST: APIRoute = async ({ request }) => {
  const webhookSecret = import.meta.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), { status: 500 })
  }

  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response(JSON.stringify({ error: 'Missing svix headers' }), { status: 400 })
  }

  const body = await request.text()
  const wh = new Webhook(webhookSecret)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
  }

  if (event.type === 'user.created' || event.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = event.data
    const email = email_addresses?.[0]?.email_address

    if (email) {
      const supabase = createServerSupabaseClient()
      await supabase.from('users').upsert(
        {
          clerk_id: id,
          email,
          first_name: first_name ?? null,
          last_name: last_name ?? null,
          avatar_url: image_url ?? null,
        },
        { onConflict: 'clerk_id' }
      )
    }
  }

  return new Response(JSON.stringify({ status: 'ok' }), { status: 200 })
}
