const DISCORD_URL = 'https://discord.com/invite/BgKg9gskM2'
const INSTAGRAM_URL = 'https://www.instagram.com/progsuhq/'

export function wrapInLayout(content: string, options?: { hideSocials?: boolean }): string {
  const showSocials = !options?.hideSocials

  const socialsBlock = showSocials ? `
          <!-- Social Links -->
          <tr>
            <td align="center" style="padding: 32px 0 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 12px;">
                    <a href="${DISCORD_URL}" target="_blank" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase; color: #8a8a89; text-decoration: none;">
                      Discord
                    </a>
                  </td>
                  <td style="padding: 0 12px;">
                    <a href="${INSTAGRAM_URL}" target="_blank" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase; color: #8a8a89; text-decoration: none;">
                      Instagram
                    </a>
                  </td>
                  <td style="padding: 0 12px;">
                    <a href="https://hacklanta.dev" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase; color: #8a8a89; text-decoration: underline; text-underline-offset: 4px;">
                      hacklanta.dev
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hacklanta</title>
</head>
<body style="margin: 0; padding: 0; background-color: #131313; font-family: 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #131313;">
    <tr>
      <td align="center" style="padding: 48px 24px;">
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="padding: 0 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="https://hacklanta.dev" style="text-decoration: none;">
                      <span style="font-family: 'Noto Serif', Georgia, 'Times New Roman', serif; font-size: 16px; font-weight: 700; letter-spacing: -0.02em; color: #ff544c; text-transform: uppercase;">
                        HACKLANTA
                      </span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0;">
              ${content}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 48px 0 0;">
              <div style="height: 1px; background: linear-gradient(to right, transparent, #353534, transparent); opacity: 0.3;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 32px 0 0;">
              <p style="margin: 0 0 20px; font-family: 'Segoe UI', Roboto, -apple-system, sans-serif; font-size: 11px; font-weight: 900; letter-spacing: -0.02em; color: #ff544c; text-transform: uppercase;">
                HACKLANTA HQ
              </p>
${socialsBlock}
              <p style="margin: 20px 0 0; font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #8a8a89; line-height: 1.6;">
                Hosted by progsu @ Georgia State University
              </p>
              <p style="margin: 16px 0 0; font-family: 'Courier New', Courier, monospace; font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: #6a6a69;">
                Sent from the digital broadsheet system v.2.0
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
