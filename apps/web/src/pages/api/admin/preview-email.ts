import type { APIRoute } from 'astro'
import { templates, type TemplateName } from '../../../lib/emails/templates'

const VALID_TEMPLATES: TemplateName[] = ['acceptance', 'acceptance_overflow', 'rejection', 'waitlist', 'announcement']

export const GET: APIRoute = async ({ url }) => {
  const template = url.searchParams.get('template') as TemplateName | null
  const firstName = url.searchParams.get('name') ?? 'Joey'

  if (!template || !VALID_TEMPLATES.includes(template)) {
    const links = VALID_TEMPLATES.map(t =>
      `<li><a href="?template=${t}${t === 'announcement' ? '&subject=Schedule%20Update&body=Check-in%20starts%20at%209am.%0A%0ABring%20your%20laptop%20and%20charger.' : ''}">${t}</a></li>`
    ).join('')
    return new Response(
      `<html><body style="font-family:sans-serif;padding:2rem;"><h2>Email Template Preview</h2><p>Pick a template:</p><ul>${links}</ul><p>Add <code>&name=FirstName</code> to customize.</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } },
    )
  }

  let result: { subject: string; html: string }

  if (template === 'announcement') {
    const subject = url.searchParams.get('subject') ?? 'Test Announcement'
    const body = url.searchParams.get('body') ?? 'This is a test announcement body.\n\nIt supports multiple paragraphs.'
    result = templates.announcement({ firstName, subject, body })
  } else {
    result = templates[template]({ firstName })
  }

  return new Response(
    `<!-- Subject: ${result.subject} -->\n${result.html}`,
    { headers: { 'Content-Type': 'text/html' } },
  )
}
