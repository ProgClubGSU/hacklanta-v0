export function wrapInMinimalLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hacklanta</title>
</head>
<body style="margin: 0; padding: 0; background-color: #111; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; color: #d4d4d4; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 520px; margin: 0 auto; padding: 40px 24px;">
    <p style="margin: 0 0 32px; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; color: #ff544c; text-transform: uppercase;">HACKLANTA</p>
    ${content}
    <div style="margin: 40px 0 0; border-top: 1px solid #2a2a2a; padding: 24px 0 0;">
      <p style="margin: 0; font-size: 12px; color: #666;">Hacklanta — hosted by progsu @ Georgia State University</p>
    </div>
  </div>
</body>
</html>`
}
