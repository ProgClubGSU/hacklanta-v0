# Hacklanta by progsu

A 12-hour hackathon hosted by [progsu](https://progsu.com) (Programming Club @ Georgia State University). Casino/poker themed hacker experience.

## Architecture

```
hacklanta/
├── apps/web/          # Astro 5 + React 19 + Tailwind v4 (frontend + API routes)
├── packages/shared/   # Shared constants and types
├── .github/workflows/ # CI pipeline
└── turbo.json         # Turborepo config
```

| Layer      | Tech                                         |
| ---------- | -------------------------------------------- |
| Frontend   | Astro 5, React 19 (islands), Tailwind CSS v4 |
| Animations | GSAP (landing), Framer Motion (dashboard)    |
| Database   | Supabase (hosted PostgreSQL + JS client)     |
| Auth       | Clerk (JWT → Supabase RLS)                   |
| Email      | Resend                                       |
| Hosting    | Vercel (frontend + serverless API routes)    |
| CI         | GitHub Actions                               |

## Prerequisites

- **Node.js** 22+ (via [nvm](https://github.com/nvm-sh/nvm))
- **pnpm** 10+ (`corepack enable && corepack prepare pnpm@latest --activate`)

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

```bash
cp apps/web/.env.example apps/web/.env
```

Edit `apps/web/.env` with your Clerk, Supabase, and Resend keys.

### 3. Run the dev server

```bash
pnpm turbo dev
```

### 4. Verify

- Landing page: http://localhost:4321
- API routes: http://localhost:4321/api/\*

## Commands

| Command             | Description               |
| ------------------- | ------------------------- |
| `pnpm turbo dev`    | Start dev server          |
| `pnpm turbo build`  | Build all workspaces      |
| `pnpm turbo lint`   | Lint all workspaces       |
| `pnpm turbo test`   | Run all tests             |
| `pnpm format`       | Format code with Prettier |
| `pnpm format:check` | Check formatting          |

## Project Structure

See [CLAUDE.md](./CLAUDE.md) for the full architecture spec, branding guidelines, data model, and implementation notes.

### Workspaces

- **[apps/web/](./apps/web/)** — Frontend application + API routes
- **[packages/shared/](./packages/shared/)** — Shared types and constants

## Branch Strategy

- `main` — production (auto-deploys to Vercel)
- Feature branches — PR with CI checks
