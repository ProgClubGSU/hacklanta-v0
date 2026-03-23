import { wrapInLayout } from './layout'

export type TemplateName = 'acceptance' | 'acceptance_overflow' | 'rejection' | 'waitlist' | 'announcement'

const DISCORD_URL = 'https://discord.com/invite/BgKg9gskM2'

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

function heroHeadline(text: string, accentWord: string, accentColor = '#ff544c'): string {
  const highlighted = text.replace(
    accentWord,
    `<span style="color: ${accentColor};">${accentWord}</span>`
  )
  return `<h1 style="margin: 0 0 32px; font-family: 'Noto Serif', Georgia, 'Times New Roman', serif; font-size: 56px; font-style: italic; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1; color: #e5e2e1;">
  ${highlighted}
</h1>`
}

function bodyText(text: string): string {
  return `<p style="margin: 0 0 16px; font-family: 'Segoe UI', Roboto, -apple-system, sans-serif; font-size: 16px; line-height: 1.7; color: #b4b5b5;">${text}</p>`
}

function leadText(text: string): string {
  return `<p style="margin: 0 0 20px; font-family: 'Noto Serif', Georgia, 'Times New Roman', serif; font-size: 22px; line-height: 1.4; font-weight: 400; color: #e5e2e1;">${text}</p>`
}

function metaLine(text: string): string {
  return `<p style="margin: 24px 0 0; font-family: 'Courier New', Courier, monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(198, 198, 199, 0.4);">
  ${text}
</p>`
}

/** Secondary headline — same serif italic style as hero but smaller, for casual FOMO drops */
function subHeadline(text: string, accentWord: string, accentColor = '#ff544c'): string {
  const highlighted = text.replace(
    accentWord,
    `<span style="color: ${accentColor};">${accentWord}</span>`
  )
  return `<p style="margin: 40px 0 0; font-family: 'Noto Serif', Georgia, 'Times New Roman', serif; font-size: 28px; font-style: italic; font-weight: 400; letter-spacing: -0.02em; line-height: 1.2; color: #e5e2e1;">
  ${highlighted}
</p>`
}

/** Filled button — serif italic, large text, dark bg on accent color */
function ctaButton(text: string, href: string, color = '#ff544c'): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 36px 0 0;">
  <tr>
    <td style="background-color: ${color}; padding: 18px 40px;">
      <a href="${href}" style="font-family: 'Noto Serif', Georgia, 'Times New Roman', serif; font-size: 20px; font-style: italic; font-weight: 400; letter-spacing: -0.01em; color: #0e0e0e; text-decoration: none;">
        ${text}
      </a>
    </td>
  </tr>
</table>`
}

/** Discord CTA — headline-sized italic serif link, whole line underlined, "Discord" highlighted, arrow at end */
function communitySection(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 48px 0 0;">
  <tr>
    <td>
      <a href="${DISCORD_URL}" style="text-decoration: none; border-bottom: 2px solid #e5e2e1; padding-bottom: 4px;">
        <span style="font-family: 'Noto Serif', Georgia, 'Times New Roman', serif; font-size: 28px; font-style: italic; font-weight: 400; letter-spacing: -0.02em; line-height: 1.3; color: #e5e2e1;">Join the community on </span><span style="font-family: 'Noto Serif', Georgia, 'Times New Roman', serif; font-size: 28px; font-style: italic; font-weight: 400; letter-spacing: -0.02em; line-height: 1.3; color: #ff544c;">Discord</span><span style="font-family: 'Noto Serif', Georgia, 'Times New Roman', serif; font-size: 28px; font-style: italic; font-weight: 400; letter-spacing: -0.02em; line-height: 1.3; color: #e5e2e1;">&nbsp;&rarr;</span>
      </a>
    </td>
  </tr>
</table>`
}

/** editorial body section with left border accent */
function editorialBody(content: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 8px;">
  <tr>
    <td style="width: 1px; background-color: rgba(171, 137, 133, 0.3); padding: 0;" width="1"></td>
    <td style="padding: 0 0 0 24px;">
      ${content}
    </td>
  </tr>
</table>`
}

export const templates = {
  acceptance(data: RecipientData): TemplateResult {
    const g = greeting(data.firstName)
    return {
      subject: "Hacklanta: You're In",
      html: wrapInLayout(`
        ${heroHeadline("You're in.", "in.", '#C9A84C')}
        ${editorialBody(`
          ${bodyText(`${g} You made the cut. Your spot is locked in but <span style="color: #ffffff; font-weight: 600; text-shadow: 0 0 12px rgba(255, 255, 255, 0.15);">it might get taken soon</span>, head to the dashboard and confirm before someone else takes it.`)}
          ${bodyText(`<span style="color: #ffffff; font-weight: 600; text-shadow: 0 0 12px rgba(255, 255, 255, 0.15);">Spots are limited and we have a waitlist full of people who would love yours.</span> Set up your profile, find a team, and get ready. 12 hours. One night.`)}
          ${metaLine('Status sync: Live / Last updated moments ago')}
        `)}
        ${subHeadline("oh btw, prize pool just hit $5,000.", "$5,000.", '#C9A84C')}
        ${ctaButton('Confirm Spot', 'https://hacklanta.dev/dashboard', '#C9A84C')}
        ${communitySection()}
      `),
      text: `You're in.

${g} You made the cut. Your spot is locked in but it might get taken soon — head to the dashboard and confirm before someone else takes it.

Spots are limited and we have a waitlist full of people who would love yours. Set up your profile, find a team, and get ready. 12 hours. One night.

Oh btw, prize pool just hit $5,000.

Confirm Spot: https://hacklanta.dev/dashboard

Join the community on Discord: ${DISCORD_URL}

-
HACKLANTA HQ
Hosted by progsu @ Georgia State University`,
    }
  },

  acceptance_overflow(data: RecipientData): TemplateResult {
    const g = greeting(data.firstName)
    return {
      subject: "Hacklanta: Overflow Admit",
      html: wrapInLayout(`
        ${heroHeadline("You're in, with a caveat.", "caveat.", '#C9A84C')}
        ${editorialBody(`
          ${bodyText(`${g} We squeezed you in. You're an overflow admit. <span style="color: #ffffff; font-weight: 600; text-shadow: 0 0 12px rgba(255, 255, 255, 0.15);">full access to the event</span>, same experience, same 12 hours. Only catch: food and swag are <span style="color: #ffffff; font-weight: 600; text-shadow: 0 0 12px rgba(255, 255, 255, 0.15);">not guaranteed</span> for overflow spots.`)}
          ${bodyText(`This was the <span style="color: #ffffff; font-weight: 600; text-shadow: 0 0 12px rgba(255, 255, 255, 0.15);">last wave of admits</span> and these spots are non-transferable. Confirm now, set up your profile, find a team.`)}
          ${metaLine('Status sync: Live / Last updated moments ago')}
        `)}
        ${subHeadline("oh btw, prize pool just hit $5,000.", "$5,000.", '#C9A84C')}
        ${ctaButton('Confirm Spot', 'https://hacklanta.dev/dashboard', '#C9A84C')}
        ${communitySection()}
      `),
      text: `You're in, with a caveat.

${g} We squeezed you in. You're an overflow admit: full access to the event, same experience, same 12 hours. Only catch, unfortunately food and swag are not guaranteed for overflow spots.

This was the last wave of admits and these spots are non-transferable. Confirm now, set up your profile, find a team.

Oh btw, prize pool just hit $5,000.

Confirm Spot: https://hacklanta.dev/dashboard

Join the community on Discord: ${DISCORD_URL}

—
HACKLANTA HQ
Hosted by progsu @ Georgia State University`,
    }
  },

  rejection(data: RecipientData): TemplateResult {
    const g = greeting(data.firstName)
    return {
      subject: 'Hacklanta: Application Update',
      html: wrapInLayout(`
        ${heroHeadline('Thanks for applying.', 'applying.', '#5C564F')}
        ${editorialBody(`
          ${bodyText(`${g} We appreciate your interest in Hacklanta. Unfortunately, we weren't able to offer you a spot this time. We had a record number of applicants and had to make some tough calls.`)}
          ${bodyText('Stay connected with progsu for future events. We\'d love to see you next time.')}
        `)}
        ${ctaButton('Stay Connected', 'https://progsu.com', '#5C564F')}
        ${communitySection()}
      `),
      text: `Thanks for applying.

${g} We appreciate your interest in Hacklanta. Unfortunately, we weren't able to offer you a spot this time. We had a record number of applicants and had to make some tough calls.

Stay connected with progsu for future events. We'd love to see you next time.

Stay Connected: https://progsu.com

Join the community on Discord: ${DISCORD_URL}

—
HACKLANTA HQ
Hosted by progsu @ Georgia State University`,
    }
  },

  waitlist(data: RecipientData): TemplateResult {
    const g = greeting(data.firstName)
    return {
      subject: "Hacklanta: You're on the Waitlist",
      html: wrapInLayout(`
        ${heroHeadline("You're on the waitlist.", "waitlist.", '#C9A84C')}
        ${editorialBody(`
          ${bodyText(`${g} Hacklanta has officially reached capacity for this cohort. While we wish we could host everyone, we are currently maintaining a curated waitlist. <span style="font-style: italic; color: #ffffff; font-weight: 600; text-shadow: 0 0 12px rgba(255, 255, 255, 0.15);">We will reach out immediately</span> if a spot opens up for your application.`)}
          ${metaLine('Status sync: Live / Last updated moments ago')}
        `)}
        ${ctaButton('Check Status', 'https://hacklanta.dev/status', '#C9A84C')}
        ${communitySection()}
      `),
      text: `You're on the waitlist.

${g} Hacklanta has officially reached capacity for this cohort. While we wish we could host everyone, we are currently maintaining a curated waitlist. We will reach out immediately if a spot opens up for your application.

Check Status: https://hacklanta.dev/status

Join the community on Discord: ${DISCORD_URL}

—
HACKLANTA HQ
Hosted by progsu @ Georgia State University`,
    }
  },

  announcement(data: AnnouncementData): TemplateResult {
    const g = greeting(data.firstName)
    const paragraphs = data.body
      .split(/\n\n+/)
      .map(p => bodyText(p.replace(/\n/g, '<br />')))
      .join('')

    return {
      subject: data.subject,
      html: wrapInLayout(`
        ${leadText(g.replace(',', ''))}
        ${editorialBody(paragraphs)}
        ${communitySection()}
      `),
      text: `${g}

${data.body}

Join the community on Discord: ${DISCORD_URL}

—
HACKLANTA HQ
Hosted by progsu @ Georgia State University`,
    }
  },
}

/** Map application status to its corresponding template name */
export const STATUS_TEMPLATE_MAP: Record<string, Exclude<TemplateName, 'announcement'> | null> = {
  accepted: 'acceptance',
  accepted_overflow: 'acceptance_overflow',
  rejected: 'rejection',
  waitlisted: 'waitlist',
  pending: null,
}
