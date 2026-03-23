import { wrapInLayout } from './layout'

export type TemplateName = 'acceptance' | 'acceptance_overflow' | 'rejection' | 'waitlist' | 'announcement'

const DISCORD_URL = 'https://discord.com/invite/BgKg9gskM2'
const DASHBOARD_URL = 'https://hacklanta.dev/dashboard'

interface TemplateResult {
  subject: string
  html: string
  text: string
}

interface RecipientData {
  firstName: string | null
}

interface AnnouncementData extends RecipientData {
  subject: string
  body: string
}

function greeting(firstName: string | null): string {
  return firstName ? `Hey ${firstName},` : 'Hey there,'
}

function p(text: string): string {
  return `<p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #d4d4d4;">${text}</p>`
}

function link(text: string, href: string): string {
  return `<a href="${href}" style="color: #C9A84C; text-decoration: underline;">${text}</a>`
}

function sig(): string {
  return `<p style="margin: 24px 0 0; font-size: 14px; color: #888;">— The Hacklanta Team</p>
    <p style="margin: 12px 0 0; font-size: 13px;">${link('Discord', DISCORD_URL)}</p>`
}

export const templates = {
  acceptance(data: RecipientData): TemplateResult {
    const g = greeting(data.firstName)
    return {
      subject: "Hacklanta - You're In",
      html: wrapInLayout(`
        ${p(`${g}`)}
        ${p(`You made the cut. Your spot at Hacklanta is <strong style="color:#fff;">confirmed.</strong>`)}
        ${p(`Head to your ${link('dashboard', DASHBOARD_URL)} to set up your profile and find a team. Spots are limited and we have a waitlist. <strong style="color:#fff;">If you don't confirm, someone else gets your spot.</strong>`)}
        ${p(`12 hours. One night. <strong style="color:#fff;">$5,000 prize pool.</strong>`)}
        ${sig()}
      `),
      text: `${g}

You made the cut. Your spot at Hacklanta is confirmed.

Head to your dashboard to set up your profile and find a team. Spots are limited and we have a waitlist. If you don't confirm, someone else gets your spot.

12 hours. One night. $5,000 prize pool.

Dashboard: ${DASHBOARD_URL}
Discord: ${DISCORD_URL}

— The Hacklanta Team`,
    }
  },

  acceptance_overflow(data: RecipientData): TemplateResult {
    const g = greeting(data.firstName)
    return {
      subject: "Hacklanta - You're In (Overflow)",
      html: wrapInLayout(`
        ${p(`${g}`)}
        ${p(`We squeezed you in — you're an overflow admit. Full access to the event, same 12 hours, same experience.`)}
        ${p(`One caveat: food and swag are not guaranteed for overflow spots. These spots are non-transferable.`)}
        ${p(`Head to your ${link('dashboard', DASHBOARD_URL)} to confirm and find a team.`)}
        ${p(`$5,000 prize pool. Don't sleep on it.`)}
        ${sig()}
      `),
      text: `${g}

We squeezed you in, but you're an overflow admit. Full access to the event, same 12 hours, same experience.

One caveat: food and swag are not guaranteed for overflow spots. These spots are non-transferable.

Head to your dashboard to confirm and find a team.

$5,000 prize pool. Don't sleep on it.

Dashboard: ${DASHBOARD_URL}
Discord: ${DISCORD_URL}

— The Hacklanta Team`,
    }
  },

  rejection(data: RecipientData): TemplateResult {
    const g = greeting(data.firstName)
    return {
      subject: 'Hacklanta - Application Update',
      html: wrapInLayout(`
        ${p(`${g}`)}
        ${p(`Thanks for applying to Hacklanta. We had a record number of applicants and unfortunately weren't able to offer you a spot this time.`)}
        ${p(`Stay connected with progsu for future events, we'd love to see you next time!`)}
        ${sig()}
      `),
      text: `${g}

Thanks for applying to Hacklanta. We had a record number of applicants and unfortunately weren't able to offer you a spot this time.

Stay connected with progsu for future events - we'd love to see you next time!

Discord: ${DISCORD_URL}

— The Hacklanta Team`,
    }
  },

  waitlist(data: RecipientData): TemplateResult {
    const g = greeting(data.firstName)
    return {
      subject: "Hacklanta - You're on the Waitlist",
      html: wrapInLayout(`
        ${p(`${g}`)}
        ${p(`Hacklanta has reached capacity. We're maintaining a waitlist and will reach out immediately if a spot opens up.`)}
        ${p(`You can check your status anytime at ${link('hacklanta.dev/status', 'https://hacklanta.dev/status')}.`)}
        ${sig()}
      `),
      text: `${g}

Hacklanta has reached capacity. We're maintaining a waitlist and will reach out immediately if a spot opens up.

You can check your status anytime at https://hacklanta.dev/status

Discord: ${DISCORD_URL}

— The Hacklanta Team`,
    }
  },

  announcement(data: AnnouncementData): TemplateResult {
    const g = greeting(data.firstName)
    const paragraphs = data.body
      .split(/\n\n+/)
      .map(para => p(para.replace(/\n/g, '<br />')))
      .join('')

    return {
      subject: data.subject,
      html: wrapInLayout(`
        ${p(`${g}`)}
        ${paragraphs}
        ${sig()}
      `),
      text: `${g}

${data.body}

Discord: ${DISCORD_URL}

— The Hacklanta Team`,
    }
  },
}

export const STATUS_TEMPLATE_MAP: Record<string, Exclude<TemplateName, 'announcement'> | null> = {
  accepted: 'acceptance',
  accepted_overflow: 'acceptance_overflow',
  rejected: 'rejection',
  waitlisted: 'waitlist',
  pending: null,
}
