import type { APIRoute } from 'astro'
import { verifyAdmin } from '../../../lib/admin'
import { createServerSupabaseClient } from '../../../lib/supabase-server'
import { createResendClient } from '../../../lib/emails/send'

const AUDIENCE_NAME = 'Hacklanta Contacts'
const BATCH_SIZE = 50
const BATCH_DELAY_MS = 200

export const POST: APIRoute = async ({ locals, url }) => {
  const auth = await verifyAdmin(locals)
  if (!auth.authorized) return auth.response

  const dryRun = url.searchParams.get('dry_run') === 'true'
  const supabase = createServerSupabaseClient()
  const resend = createResendClient()

  // Fetch all contacts from the view
  const { data: contacts, error: dbError } = await supabase
    .from('resend_contacts')
    .select('*')

  if (dbError) {
    return new Response(JSON.stringify({ error: dbError.message }), { status: 500 })
  }

  if (!contacts?.length) {
    return new Response(JSON.stringify({ error: 'No contacts found' }), { status: 404 })
  }

  if (dryRun) {
    return new Response(JSON.stringify({
      dry_run: true,
      total_contacts: contacts.length,
      sample: contacts.slice(0, 5).map(c => ({ email: c.email, first_name: c.first_name })),
    }))
  }

  // Find or create audience
  let audienceId: string | null = null
  try {
    const { data: audiences } = await resend.audiences.list()
    const existing = audiences?.data?.find((a: { name: string }) => a.name === AUDIENCE_NAME)
    if (existing) {
      audienceId = existing.id
    } else {
      const { data: created } = await resend.audiences.create({ name: AUDIENCE_NAME })
      audienceId = created?.id ?? null
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: `Failed to get/create audience: ${err}` }), { status: 500 })
  }

  if (!audienceId) {
    return new Response(JSON.stringify({ error: 'Could not resolve audience ID' }), { status: 500 })
  }

  // Push contacts in batches
  let synced = 0
  let failed = 0
  const errors: Array<{ email: string; error: string }> = []

  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE)

    for (const contact of batch) {
      try {
        await resend.contacts.create({
          audienceId,
          email: contact.email,
          firstName: contact.first_name || undefined,
          lastName: contact.last_name || undefined,
          unsubscribed: false,
        })
        synced++
      } catch (err: unknown) {
        // If contact already exists, try to update
        const errMsg = err instanceof Error ? err.message : String(err)
        if (errMsg.includes('already exists')) {
          synced++ // already there, count as success
        } else {
          failed++
          errors.push({ email: contact.email, error: errMsg })
        }
      }
    }

    if (i + BATCH_SIZE < contacts.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  console.log(`[sync-resend] Done: synced=${synced}, failed=${failed}`)

  return new Response(JSON.stringify({
    audienceId,
    total_contacts: contacts.length,
    synced,
    failed,
    ...(errors.length > 0 ? { errors: errors.slice(0, 20) } : {}),
  }))
}
