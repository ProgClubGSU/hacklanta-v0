# @hacklanta/web

Astro 5 frontend with React 19 islands and Tailwind CSS v4.

## Stack

- **Astro 5** — Static-first framework, zero JS by default
- **React 19** — Interactive islands (`client:load` / `client:visible`)
- **Tailwind CSS v4** — Via Vite plugin (`@tailwindcss/vite`)
- **GSAP** — Landing page scroll animations
- **Framer Motion** — Dashboard UI transitions

## Structure

```
src/
├── layouts/
│   ├── BaseLayout.astro        # HTML shell, meta, fonts
│   ├── LandingLayout.astro     # Landing page wrapper
│   └── DashboardLayout.astro   # Authenticated dashboard shell
├── pages/
│   ├── index.astro             # Landing page
│   ├── apply.astro             # Application form
│   ├── dashboard/              # Contestant dashboard
│   └── admin/                  # Admin panel
├── components/
│   ├── landing/                # Static Astro components
│   ├── dashboard/              # React islands
│   ├── admin/                  # React islands
│   └── ui/                     # Shared UI primitives
├── lib/
│   ├── api.ts                  # Typed API client
│   ├── clerk.ts                # Clerk config
│   └── sse.ts                  # SSE client for real-time
└── styles/
    └── global.css              # Tailwind directives + theme
```

## Development

```bash
# From repo root
pnpm turbo dev --filter=@hacklanta/web

# Or from this directory
pnpm dev
```

Runs on http://localhost:4321.

## Commands

| Command         | Description                     |
| --------------- | ------------------------------- |
| `pnpm dev`      | Start Astro dev server          |
| `pnpm build`    | Production build                |
| `pnpm preview`  | Preview production build        |
| `pnpm lint`     | ESLint + Astro type check       |

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

| Variable                       | Description                  |
| ------------------------------ | ---------------------------- |
| `PUBLIC_API_URL`               | Backend API base URL         |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key        |
| `PUBLIC_SENTRY_DSN`            | Sentry DSN (optional)        |

## Theme

The design uses a casino/poker + hacker terminal aesthetic. Key colors defined in `src/styles/global.css`:

| Token          | Value     | Usage                   |
| -------------- | --------- | ----------------------- |
| `base-black`   | `#0a0a0a` | Page background         |
| `neon-green`   | `#00ff88` | Primary accent          |
| `gold`         | `#ffd700` | Secondary accent        |
| `hot-pink`     | `#ff3366` | Tertiary accent         |
| `suit-red`     | `#e63946` | Card suit symbols       |

Fonts: **JetBrains Mono** (terminal/code), **Inter** (headings/display).
