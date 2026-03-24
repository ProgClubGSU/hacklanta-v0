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

  // Fetch existing contacts from Resend to check unsubscribes
  const existingEmails = new Set<string>()
  const unsubscribedEmails = new Set<string>()
  try {
    const { data: resendContacts } = await resend.contacts.list({ audienceId })
    for (const c of resendContacts?.data ?? []) {
      existingEmails.add(c.email.toLowerCase())
      if (c.unsubscribed) {
        unsubscribedEmails.add(c.email.toLowerCase())
      }
    }
  } catch {
    // First sync — no existing contacts, proceed
  }

  // Filter out unsubscribed contacts and already-synced contacts
  const newContacts = contacts.filter(c => {
    const email = c.email.toLowerCase()
    if (unsubscribedEmails.has(email)) return false // respect unsubscribe
    if (existingEmails.has(email)) return false // already in Resend
    return true
  })

  if (dryRun) {
    return new Response(JSON.stringify({
      dry_run: true,
      total_in_db: contacts.length,
      already_in_resend: existingEmails.size,
      unsubscribed: unsubscribedEmails.size,
      new_to_sync: newContacts.length,
    }))
  }

  // Push only new contacts
  let synced = 0
  let skippedExisting = existingEmails.size
  let skippedUnsubscribed = unsubscribedEmails.size
  let failed = 0
  const errors: Array<{ email: string; error: string }> = []

  for (let i = 0; i < newContacts.length; i += BATCH_SIZE) {
    const batch = newContacts.slice(i, i + BATCH_SIZE)

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
        const errMsg = err instanceof Error ? err.message : String(err)
        if (errMsg.includes('already exists')) {
          synced++
        } else {
          failed++
          errors.push({ email: contact.email, error: errMsg })
        }
      }
    }

    if (i + BATCH_SIZE < newContacts.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  console.log(`[sync-resend] Done: new=${synced}, existing=${skippedExisting}, unsubscribed=${skippedUnsubscribed}, failed=${failed}`)

  return new Response(JSON.stringify({
    audienceId,
    total_in_db: contacts.length,
    new_synced: synced,
    already_in_resend: skippedExisting,
    unsubscribed_skipped: skippedUnsubscribed,
    failed,
    ...(errors.length > 0 ? { errors: errors.slice(0, 20) } : {}),
  }))
}
