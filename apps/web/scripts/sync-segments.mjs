#!/usr/bin/env node
/**
 * One-off script to populate Resend segments from Supabase data.
 * Respects Resend rate limit: 5 requests/second for segment add.
 * Run: node scripts/sync-segments.mjs
 */
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env manually
const envPath = resolve(__dirname, '../.env')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const resend = new Resend(env.RESEND_API_KEY)
const supabase = createClient(env.PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const SEGMENT_DEFS = {
  'Unconfirmed': (c) => c.is_accepted === true && !c.is_confirmed,
  'Confirmed': (c) => c.is_confirmed === true,
  'No Team': (c) => c.is_confirmed === true && !c.has_team,
  'Looking for Team': (c) => c.looking_for_team === true,
  'Has Team': (c) => c.has_team === true,
}

// Resend rate limit: 5 requests per second for segment add
const BATCH_SIZE = 3
const BATCH_DELAY_MS = 1200 // well over 1 second to stay safe

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  console.log('Fetching contacts from Supabase...')
  const { data: contacts, error } = await supabase.from('resend_contacts').select('*')
  if (error) { console.error(error); process.exit(1) }
  console.log(`  ${contacts.length} contacts in DB`)

  console.log('Fetching segments from Resend...')
  const { data: segData } = await resend.segments.list()
  const segmentMap = {}
  for (const seg of segData?.data ?? []) {
    if (seg.name in SEGMENT_DEFS) {
      segmentMap[seg.name] = seg.id
    }
  }
  console.log(`  Found segments: ${Object.keys(segmentMap).join(', ')}`)

  for (const [name, filterFn] of Object.entries(SEGMENT_DEFS)) {
    const segmentId = segmentMap[name]
    if (!segmentId) {
      console.log(`  SKIP "${name}" — not found in Resend`)
      continue
    }

    const matching = contacts.filter(filterFn)
    const estimatedTime = Math.ceil(matching.length / BATCH_SIZE) * (BATCH_DELAY_MS / 1000)
    console.log(`\nSyncing "${name}" — ${matching.length} contacts (~${Math.round(estimatedTime)}s)`)

    let added = 0
    let alreadyIn = 0
    let errors = 0

    for (let i = 0; i < matching.length; i += BATCH_SIZE) {
      const batch = matching.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map(c =>
          resend.contacts.segments.add({ email: c.email, segmentId })
        )
      )

      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value?.error) {
            const msg = r.value.error.message || ''
            if (msg.includes('already') || msg.includes('exists')) {
              alreadyIn++
            } else {
              errors++
              if (errors <= 3) console.error(`    API Error: ${msg}`)
            }
          } else {
            added++
          }
        } else {
          const msg = r.reason?.message || String(r.reason)
          if (msg.includes('already') || msg.includes('exists')) {
            alreadyIn++
          } else {
            errors++
            if (errors <= 3) console.error(`    Error: ${msg}`)
          }
        }
      }

      // Progress every 50
      const done = Math.min(i + BATCH_SIZE, matching.length)
      if (done % 50 === 0 || done === matching.length) {
        process.stdout.write(`  ${done}/${matching.length} (${added} new, ${alreadyIn} existing)\n`)
      }

      // Rate limit: wait before next batch
      if (i + BATCH_SIZE < matching.length) {
        await sleep(BATCH_DELAY_MS)
      }
    }

    console.log(`  ✓ "${name}": ${added} added, ${alreadyIn} already in, ${errors} errors`)

    // Wait between segments to reset rate limit window
    console.log('  Waiting 3s before next segment...')
    await sleep(3000)
  }

  console.log('\nDone!')
}

main().catch(console.error)
