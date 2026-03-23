import { Resend } from 'resend'

interface EmailPayload {
  to: string
  subject: string
  html: string
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
    throw new Error('RESEND_API_KEY not configured')
  }
  return new Resend(apiKey)
}

export async function sendBatchEmails(
  resend: Resend,
  emails: EmailPayload[],
): Promise<BatchSendResult> {
  if (emails.length === 0) {
    return { sent: 0, errors: 0, total: 0, errorDetails: [] }
  }

  let sent = 0
  let errors = 0
  const errorDetails: BatchSendResult['errorDetails'] = []

  // Chunk into groups of BATCH_SIZE
  const chunks: EmailPayload[][] = []
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    chunks.push(emails.slice(i, i + BATCH_SIZE))
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]

    try {
      const { error } = await resend.batch.send(
        chunk.map(email => ({
          from: FROM,
          to: email.to,
          subject: email.subject,
          html: email.html,
        })),
      )

      if (error) {
        errors += chunk.length
        for (const email of chunk) {
          errorDetails.push({ email: email.to, error: error.message })
        }
      } else {
        sent += chunk.length
      }
    } catch (err) {
      errors += chunk.length
      const message = err instanceof Error ? err.message : 'Unknown error'
      for (const email of chunk) {
        errorDetails.push({ email: email.to, error: message })
      }
    }

    // Rate limit: wait between chunks (not after the last one)
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  return { sent, errors, total: emails.length, errorDetails }
}
