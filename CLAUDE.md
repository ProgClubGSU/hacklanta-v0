# CLAUDE.md — Hacklanta

## Project Overview

This is the official website for **Hacklanta**, a 12-hour hackathon hosted by **progsu** (Programming Club @ Georgia State University). The site includes a high-performance marketing landing page, an applicant/contestant portal with dashboards, and an admin panel.

**Domain:** hacklanta.dev (via Vercel)

---

## Branding & Theme: Casino/Poker meets Hacker Terminal

Hacklanta is **casino/poker themed**. The visual identity fuses three aesthetics:

### 1. progsu's Existing Aesthetic (Primary Foundation)
Reference: [progsu.com](https://progsu.com)
- **Dark theme** with monochrome base (near-black backgrounds, white/gray text)
- **Terminal/CLI motifs** — command prompts (`$ join progsu`), monospace type, blinking cursors, ASCII art
- **Hacker-coded feel** — binary streams, glitch effects, raw/unpolished energy
- **Typography:** Mix of monospace (code) and bold sans-serif (headings). Tight line-height, all-caps labels
- **Layout:** Numbered sections (`[01]`, `[02]`), tag-style labels (`// section subtitle`), grid-based

### 2. Gen-Z Gambling / Rainbet Aesthetic (Flavor Layer)
- **Neon accent colors** on dark backgrounds — electric green, hot pink, gold, cyan glows
- **Casino UI patterns** — card flip animations, chip stacking, roulette spin motifs, slot-machine reveals
- **Bold, juicy micro-interactions** — hover glow effects, pulsing CTAs, particle bursts on click
- **Crypto-casino energy** — feels fast, high-stakes, slightly unhinged, dopamine-inducing
- **Card/chip iconography** — poker chips, playing cards (♠♦♣♥), dice as decorative elements

### 3. Major Hackathon Landing Pages (Structure Reference)
- Prominent countdown timer to event
- Clear application CTA above the fold
- Schedule/timeline section
- Sponsor logos grid
- Prize showcase
- FAQ accordion
- Social proof (past events, member count)

### Synthesis Guidelines
The result should feel like **if progsu.com ran an underground hacker casino**. Specifically:
- **Base:** Dark, terminal-style layout from progsu.com (keep the CLI motifs, numbered sections, monospace type)
- **Accent:** Neon casino glow effects layered on top (neon green/gold/pink highlights, card suit symbols, chip graphics)
- **Interactions:** Gambling-inspired animations — text reveals like slot machines, card flip transitions, "dealing" animations for content sections, chip-stack counters for stats
- **Copy tone:** Irreverent, gen-z, brainrot-adjacent. Think "go all in" not "register now". CTAs like `$ ante up`, `// place_bet`, `DEAL ME IN`
- **Typography:** Primary monospace (JetBrains Mono, Fira Code, or similar) for the terminal layer. Bold display sans-serif (Satoshi, Inter, or Geist Black) for headings. Gold or neon accent for key stats/numbers
- **Color palette:** Near-black base (`#0a0a0a`–`#121212`), neon green primary (`#00ff88` or similar), gold accent (`#ffd700`), hot pink secondary (`#ff3366`), with subtle card-suit red (`♦♥`) and monochrome white for text. Glow/bloom effects on accent colors via CSS `box-shadow` and `text-shadow`

### Elements to Incorporate
- Poker chip motif for the Hacklanta logo/badge
- Playing card suit symbols (♠♦♣♥) as section dividers or decorative elements
- "Betting slip" style for the application form or status cards
- Leaderboard/scoreboard aesthetic for team standings or minigame results during the event
- Slot-machine-style number counters for stats (applicants, teams, prizes)
- ASCII art poker hands or card graphics (stays on-brand with progsu's ASCII art usage)

---

## Architecture Summary

```
hacklanta/
├── apps/
│   └── web/                  # Astro 5 frontend (landing + dashboards + API routes)
├── packages/
│   └── shared/               # Shared types, constants
├── .github/
│   └── workflows/            # CI pipeline
├── turbo.json                # Turborepo config
└── package.json              # Root workspace config (pnpm)
```

Use **Turborepo** for monorepo orchestration (`turbo dev`, `turbo build`, `turbo lint`).

---

## Tech Stack

| Layer           | Technology                                         |
| --------------- | -------------------------------------------------- |
| Frontend        | Astro 5, React 19 (islands), Tailwind CSS v4       |
| Animations      | GSAP (landing page scroll/hero), Framer Motion (dashboard UI) |
| Database        | Supabase (hosted PostgreSQL + client SDK)           |
| Auth            | Clerk (@clerk/astro for SSR, Clerk JWT → Supabase) |
| Server Routes   | Astro API routes (Vercel serverless functions)      |
| Email           | Resend (transactional email)                       |
| Hosting         | Vercel (frontend + API routes)                     |
| Error Tracking  | Sentry (@sentry/astro)                             |
| CI              | GitHub Actions                                     |

### Key Patterns

- **No separate backend.** The frontend talks to Supabase directly from React components using `@supabase/supabase-js` with Clerk JWTs for auth. Server-side operations (webhooks, admin actions, email) are Astro API routes that run as Vercel serverless functions.
- **Supabase RLS** enforces authorization at the database level using `auth.jwt()->>'sub'` to match Clerk user IDs.
- **Clerk JWT template** named `supabase` bridges Clerk auth → Supabase auth. Created in Clerk Dashboard, uses the Supabase JWT secret as signing key.

---

## Frontend — `apps/web/`

### Framework: Astro 5 + React Islands

Astro ships zero JS by default. Interactive components (dashboards, forms) are React islands hydrated with `client:load` or `client:visible`. The landing page should ship near-zero JS and score 100 on Lighthouse.

### Structure

```
apps/web/
├── astro.config.mjs
├── public/
│   └── fonts/, images/, og/
├── supabase/
│   └── rls-policies.sql           # RLS policy reference (apply via Supabase SQL Editor)
├── src/
│   ├── layouts/
│   │   ├── BaseLayout.astro       # HTML shell, meta, fonts
│   │   ├── LandingLayout.astro    # Landing page wrapper
│   │   └── DashboardLayout.astro  # Authenticated dashboard shell
│   ├── pages/
│   │   ├── index.astro            # Landing page
│   │   ├── apply.astro            # Application form page
│   │   ├── status.astro           # Application status page
│   │   ├── dashboard/
│   │   │   ├── index.astro        # Contestant dashboard home
│   │   │   └── team.astro         # Team finder / team management
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   ├── clerk.ts       # Clerk webhook (user sync)
│   │   │   │   └── tally.ts       # Tally webhook (application form)
│   │   │   ├── users/
│   │   │   │   └── sync.ts        # Manual user sync
│   │   │   ├── applications/
│   │   │   │   └── me.ts          # Current user's application status
│   │   │   └── admin/
│   │   │       └── accept-users.ts # Bulk acceptance + email
│   │   └── admin/
│   │       └── index.astro
│   ├── components/
│   │   ├── landing/               # Static Astro components + GSAP
│   │   ├── dashboard/             # React islands (client:load)
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── ProfileEditorModal.tsx
│   │   │   ├── TeamManager.tsx
│   │   │   ├── TeamGrid.tsx
│   │   │   ├── TeamDetailModal.tsx
│   │   │   ├── UserGrid.tsx
│   │   │   ├── JoinRequestManager.tsx
│   │   │   └── TabNavigation.tsx
│   │   ├── status/
│   │   │   └── ApplicationStatus.tsx
│   │   └── ui/                    # Shared UI primitives
│   ├── lib/
│   │   ├── api.ts                 # Supabase-based API client (teams, profiles, users)
│   │   ├── supabase.ts            # Client-side Supabase factory (Clerk JWT auth)
│   │   ├── supabase-server.ts     # Server-side Supabase client (service role key)
│   │   └── clerk-types.d.ts       # Window.Clerk type declaration
│   └── styles/
│       └── global.css             # Tailwind directives + custom CSS
```

### Landing Page Design Guidelines

The landing page must feel premium and high-energy — like an underground hacker casino. See the **Branding & Theme** section above for the full design language.

- **Hero section:** Full-viewport, animated (GSAP ScrollTrigger). Dark base with neon casino glow effects. Animated text reveals (slot-machine style). Poker chip / card motifs. Prominent CTA: "DEAL ME IN" / "$ ante up" style.
- **Scroll animations:** Sections fade/slide in on scroll using GSAP ScrollTrigger. Card-dealing or chip-stacking entrance animations. Smooth, performant, 60fps.
- **Typography:** Monospace (JetBrains Mono / Fira Code) for terminal elements. Bold sans-serif (Satoshi / Inter / Geist) for headings. Neon green or gold for accent numbers/stats.
- **Color palette:** See Branding section. Near-black base, neon green primary, gold accent, hot pink secondary. Glow effects on accent elements.
- **Sections:** Hero → About Hacklanta → Schedule/Timeline → Prizes → Sponsors → FAQ → Footer. Keep progsu's numbered section style (`[01]`, `[02]`) and tag labels (`// section subtitle`).
- **Performance:** All landing page content is static Astro (zero client JS). GSAP loaded only for animations. Images optimized with Astro's `<Image />` component. Target 100/100 Lighthouse.
- **Stats/Counters:** Use slot-machine-style animated number counters for stats (applicant count, prize pool, team count).

### Dashboard & Admin Design Guidelines

- Maintain the dark theme and terminal motifs from the landing page throughout the dashboard.
- Use Framer Motion for transitions (page transitions, card-flip modal animations, list reordering).
- "Betting slip" style for application status cards.
- Toast notifications styled as casino chip / card pop-ins for actions.
- Leaderboard/scoreboard aesthetic for team standings during the event.

---

## Supabase Client Architecture

### Client-Side (`lib/supabase.ts`)

Used in React components. Creates a Supabase client with Clerk JWT auth:

```typescript
createClerkSupabaseClient()
// Uses window.Clerk.session.getToken({ template: 'supabase' }) as accessToken
```

### Server-Side (`lib/supabase-server.ts`)

Used in Astro API routes. Creates a Supabase client with the service role key (bypasses RLS):

```typescript
createServerSupabaseClient()
// Uses SUPABASE_SERVICE_ROLE_KEY — server-side only
```

### API Client (`lib/api.ts`)

All dashboard components use `api.*` methods that call Supabase directly:

- `api.getProfile()` / `api.upsertProfile()` / `api.listProfiles()`
- `api.createTeam()` / `api.getMyTeam()` / `api.joinTeam()` / `api.leaveTeam()`
- `api.listTeams()` / `api.getTeamById()`
- `api.createJoinRequest()` / `api.listTeamJoinRequests()` / `api.updateJoinRequest()` / `api.withdrawJoinRequest()`
- `api.listUsers()`

Key helpers:
- `getCurrentUserId()` — resolves Clerk user ID → internal UUID, with auto-sync fallback via `POST /api/users/sync`
- `flattenMember()` / `flattenJoinRequest()` — transforms Supabase nested join results into flat objects for component compatibility

### Astro API Routes (`pages/api/`)

Server-side endpoints running as Vercel serverless functions:

| Route | Purpose |
| ----- | ------- |
| `POST /api/webhooks/clerk` | Clerk webhook — syncs user data on `user.created`/`user.updated` |
| `POST /api/webhooks/tally` | Tally webhook — creates applications from form submissions |
| `POST /api/users/sync` | Manual user sync (first-login fallback) |
| `GET /api/applications/me` | Current user's application status |
| `POST /api/admin/accept-users` | Bulk acceptance emails via Resend |

### Auth Flow

1. Frontend uses Clerk's `<SignIn />` / `<SignUp />` React components
2. Clerk issues a session token
3. Client-side: `supabase.ts` gets a Clerk JWT (template: `supabase`) and passes it as `accessToken` to the Supabase client
4. Supabase validates the JWT and applies RLS policies using `auth.jwt()->>'sub'` (Clerk user ID)
5. Server-side: Astro API routes use `locals.auth()` from Clerk middleware for authentication, and the Supabase service role client for DB access
6. Clerk webhooks sync user data to the `users` table so the client can JOIN user data in queries

### RLS Policies

Defined in `apps/web/supabase/rls-policies.sql`. Key patterns:
- Users can always see their **own** `users` record (needed for `getCurrentUserId()`)
- Only users with `is_accepted = true` can see other accepted users, profiles, teams, team members, and join requests (gates the team finder)
- `is_accepted` has no user-facing UPDATE policy — only modifiable by service role via the admin accept flow
- Users can only INSERT/UPDATE/DELETE their own records (matched via `auth.jwt()->>'sub'` → `users.clerk_id`)
- Team leaders can manage join requests for their team
- Applications are read-only for users (writes via service role from webhooks)
- A helper view `accepted_self` simplifies the accepted-user check across policies

---

## Data Model (Supabase PostgreSQL)

### Core Tables

```sql
-- Synced from Clerk webhooks
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR UNIQUE NOT NULL,
    email VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    avatar_url VARCHAR,
    role VARCHAR DEFAULT 'user',  -- 'user' | 'admin'
    is_accepted BOOLEAN DEFAULT false,  -- only set by service role (admin accept flow)
    acceptance_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    display_name VARCHAR NOT NULL,
    bio TEXT,
    linkedin_url VARCHAR,
    github_url VARCHAR,
    portfolio_url VARCHAR,
    looking_for_team BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tally_response_id VARCHAR UNIQUE,
    status VARCHAR DEFAULT 'pending',  -- 'pending' | 'accepted' | 'rejected' | 'waitlisted'
    email VARCHAR,
    university VARCHAR NOT NULL,
    major VARCHAR NOT NULL,
    year_of_study VARCHAR NOT NULL,
    graduation_date DATE,
    resume_url VARCHAR,
    github_url VARCHAR,
    linkedin_url VARCHAR,
    why_attend TEXT,
    experience_level VARCHAR,
    dietary_restrictions VARCHAR,
    tshirt_size VARCHAR,
    phone_number VARCHAR,
    how_did_you_hear VARCHAR,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    invite_code VARCHAR UNIQUE NOT NULL,
    max_size INT DEFAULT 4,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR DEFAULT 'member',  -- 'leader' | 'member'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

CREATE TABLE team_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected' | 'withdrawn'
    message TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Environment Variables

**Frontend (`apps/web/.env`):**
```
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

RESEND_API_KEY=re_...
CLERK_WEBHOOK_SECRET=whsec_...
TALLY_SIGNING_SECRET=...

PUBLIC_SENTRY_DSN=...
PUBLIC_TURNSTILE_SITE_KEY=...
```

---

## CI/CD

### Pipeline: `ci.yml`

Runs on pull requests to `main`:
- Frontend lint and test via `pnpm turbo lint/test`

### Deployment

Frontend deploys to Vercel via git integration (push to `main`). Astro API routes deploy as Vercel serverless functions automatically.

### Branch Strategy

- `main` → production (auto-deploys to Vercel)
- Feature branches → PR with CI checks

---

## Local Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm turbo dev
# or
cd apps/web && pnpm dev
```

The Astro dev server runs at `http://localhost:4321`. API routes are available at `http://localhost:4321/api/*`.

### Tooling Rules

- **Always use `pnpm`** — never `npm`. The project uses pnpm as its package manager.
- **Always use `uv`** for any Python tooling — never raw `python`, `python3`, or `pip`.

---

## Key Implementation Notes

1. **Clerk Webhooks:** The `/api/webhooks/clerk` endpoint verifies signatures using `svix` and syncs `user.created`/`user.updated` events to the `users` table. This is critical — without it, the API client can't resolve Clerk user IDs to internal UUIDs.

2. **Tally Integration:** Applications are submitted via a Tally form. The `/api/webhooks/tally` endpoint receives form submissions, maps fields by label, and upserts into the `applications` table. Duplicate submissions are handled via `tally_response_id` unique constraint.

3. **First-Login User Sync:** If a user's Clerk webhook hasn't fired yet (race condition), `getCurrentUserId()` in `api.ts` automatically calls `POST /api/users/sync` to create the user record. Components don't need to handle this.

4. **Team Finder:** Accepted contestants can create teams (generates a 6-char invite code), browse teams, and send join requests. Team leaders approve/reject requests. All via direct Supabase calls from React components.

5. **Admin Bulk Accept:** `POST /api/admin/accept-users` finds accepted users who haven't received emails, sends acceptance emails via Resend, and marks `acceptance_sent_at`. Admin role is verified via Clerk metadata.

6. **Supabase RLS is the security boundary.** Without RLS policies applied, the anon key would allow unrestricted access. The policies in `supabase/rls-policies.sql` must be applied via the Supabase SQL Editor.
