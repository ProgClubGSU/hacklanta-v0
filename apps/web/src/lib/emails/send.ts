import { Resend } from 'resend'

interface EmailPayload {
  to: string
  subject: string
  html: string
  text: string
}

export interface BatchSendResult {
  sent: number
  errors: number
  total: number
  errorDetails: Array<{ email: string; error: string }>
}

const FROM = 'Hacklanta <official@progsu.com>'
const BATCH_SIZE = 100
const BATCH_DELAY_MS = 250

export function createResendClient(): Resend {
  const apiKey = import.meta.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured — set it in your environment variables')
  }
  return new Resend(apiKey)
}

export async function sendBatchEmails(
  resend: Resend,
  emails: EmailPayload[],
): Promise<BatchSendResult> {
  if (emails.length === 0) {
    console.warn('[email] sendBatchEmails called with 0 emails — skipping')
    return { sent: 0, errors: 0, total: 0, errorDetails: [] }
  }

  console.log(`[email] Sending ${emails.length} email(s) to: ${emails.map(e => e.to).join(', ')}`)

  let sent = 0
  let errors = 0
  const errorDetails: BatchSendResult['errorDetails'] = []

  const chunks: EmailPayload[][] = []
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    chunks.push(emails.slice(i, i + BATCH_SIZE))
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const payload = chunk.map(email => ({
      from: FROM,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      headers: {
        'List-Unsubscribe': '<https://hacklanta.dev/dashboard>',
      },
    }))

    try {
      const { data, error } = await resend.batch.send(payload)

      if (error) {
        console.error(`[email] Resend API error (chunk ${i + 1}/${chunks.length}):`, JSON.stringify(error))
        errors += chunk.length
        for (const email of chunk) {
          errorDetails.push({ email: email.to, error: error.message })
        }
      } else {
        console.log(`[email] Chunk ${i + 1}/${chunks.length} sent — ${chunk.length} email(s), IDs:`, JSON.stringify(data))
        sent += chunk.length
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[email] Exception sending chunk ${i + 1}/${chunks.length}:`, message)
      errors += chunk.length
      for (const email of chunk) {
        errorDetails.push({ email: email.to, error: message })
      }
    }

    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  console.log(`[email] Batch complete: ${sent} sent, ${errors} failed out of ${emails.length} total`)
  if (errorDetails.length > 0) {
    console.error('[email] Error details:', JSON.stringify(errorDetails))
  }

  return { sent, errors, total: emails.length, errorDetails }
}
