# Hacklanta — Next Steps

What's done, what's left, and the recommended order to build it all out.

---

## What's Working Now

The monorepo scaffold is complete and verified:

- **Dev environment** — `turbo dev` starts Astro on :4321, `docker compose up` runs Postgres + Redis
- **API skeleton** — FastAPI app runs, `GET /api/v1/health` returns `{"status":"ok"}`
- **CI pipeline** — `turbo lint` passes across all workspaces, GitHub Actions CI runs on PRs
- **Design system** — Tailwind v4 theme with full casino color palette, fonts loaded
- **Landing page smoke test** — Hero section renders with neon glow, card suits, terminal styling
- **Shared constants** — Application statuses, event types, team roles, food order statuses exported
- **Celery** — Configured with Redis broker, ready for tasks
- **Alembic** — Async migration environment configured, ready for models
- **CDK** — All 6 stacks declared (empty), app entry point wired

---

## Phase 1: Foundation (do these first)

These are blocking dependencies for everything else.

### 1.1 — Clerk Authentication Setup

**Why first:** Almost every feature requires knowing who the user is.

- [x] Create a Clerk application at [clerk.com](https://clerk.com)
- [x] Add keys to `apps/web/.env` (`PUBLIC_CLERK_PUBLISHABLE_KEY`) and `services/api/.env` (`CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`)
- [x] Install `@clerk/astro` in the frontend and wrap the app with the Clerk provider
- [x] Implement `services/api/app/core/security.py`:
  - `get_current_user` dependency — verifies Clerk JWT from `Authorization` header
  - `require_admin` dependency — checks Clerk metadata for admin role
- [x] Update `apps/web/src/lib/api.ts` to attach the Clerk session token via `getToken()` on every request

### 1.2 — Database Models + First Migration

**Why first:** Every API endpoint needs the database.

- [x] Create a shared SQLAlchemy `Base` in `app/core/database.py`
- [x] Implement the `users` model in a new `app/domains/users/models.py` (synced from Clerk)
- [x] Implement all ORM models matching the SQL schema in CLAUDE.md:
  - `app/domains/applicants/models.py` — `applications` table
  - `app/domains/contestants/models.py` — `teams`, `team_members` tables
  - `app/domains/events/models.py` — `events` table
  - `app/domains/food/models.py` — `food_menu_items`, `food_orders`, `food_order_items` tables
  - `app/domains/announcements/models.py` — `announcements` table
  - `app/utils/models.py` — `email_logs` table
- [x] Import all models in `alembic/env.py` and set `target_metadata = Base.metadata`
- [x] Generate the initial migration: `alembic revision --autogenerate -m "initial schema"`
- [x] Run it: `alembic upgrade head`

### 1.3 — Clerk Webhook Handler

**Why first:** The API needs local user records to associate with applications, teams, etc.

- [x] Create `app/domains/users/` domain (router, service, repository, models)
- [x] Add `POST /api/v1/webhooks/clerk` endpoint
- [x] Verify webhook signatures using `svix`
- [x] Handle `user.created` and `user.updated` events — upsert into the local `users` table
- [x] Wire the router into `app/main.py`

---

## Phase 2: Core Features

Build these roughly in order — each builds on the previous.

### 2.1 — Application System (Backend)

Files: `services/api/app/domains/applicants/`

- [x] Pydantic schemas (`schemas.py`): `ApplicationCreate`, `ApplicationResponse`, `ApplicationUpdate`
- [x] Repository (`repository.py`): create, get by ID, get by user, list with filters
- [x] Service (`service.py`): submit application, check duplicate, get status
- [x] Router (`router.py`):
  - `POST /api/v1/applications` — submit application (authenticated)
  - `GET /api/v1/applications/me` — get current user's application
  - `GET /api/v1/applications/{id}` — get by ID (admin only)
  - `GET /api/v1/applications` — list all (admin only, with pagination + filters)
  - `PATCH /api/v1/applications/{id}` — update status (admin only)
- [x] Wire router into `app/main.py`
- [x] Pagination utility (`app/utils/pagination.py`): `PaginationParams`, `PaginatedResponse`, `paginate` helper

### 2.2 — Application Form (Frontend)

Files: `apps/web/src/components/dashboard/ApplicationForm.tsx`, `apps/web/src/pages/apply.astro`

- [x] Build the form with all fields from the data model (university, major, year, resume, GitHub, LinkedIn, why attend, experience level, dietary, t-shirt size)
- [x] Resume upload via S3 presigned URL flow — `POST /applications/upload-url` generates presigned URL, frontend uploads directly to S3, stores key in application
- [x] Form validation (client-side via HTML5 required + server returns 422)
- [x] Betting-slip styling per the branding spec
- [x] `ApplicationStatus.tsx` — show application status card after submission (with status-specific colors/glow)
- [x] `ApplicationPage.tsx` — container component that loads existing application or shows form
- [x] Wired into `apply.astro` as React island with `client:load`
- [x] Updated `api.ts` — typed fetch wrapper now returns `T` directly with better error handling

### 2.3 — Admin: Applicant Review

Files: `services/api/app/domains/admin/`, `apps/web/src/components/admin/`

- [x] Backend: `PATCH /api/v1/applications/{id}` — update status (accept/reject/waitlist)
- [x] Backend: `POST /api/v1/applications/bulk` — bulk accept/reject with email triggers
- [x] `ApplicantTable.tsx` — paginated data table with status/experience filters, clickable rows
- [x] `ApplicantReview.tsx` — review panel with accept/reject/waitlist buttons + full detail view
- [x] `StatsOverview.tsx` — stat counters for total, pending, accepted, waitlisted, rejected
- [x] `ApplicantsPage.tsx` — container component with table + review panel side-by-side layout
- [x] Wired into `admin/applicants.astro` and `admin/index.astro` as React islands

### 2.4 — Email System

Files: `services/api/app/utils/email.py`, `services/api/app/workers/email_tasks.py`

- [x] Implement SES client wrapper in `utils/email.py` (boto3 async, `send_email` + `render_template`)
- [x] Build email templates (inline HTML): application received, accepted, rejected, waitlisted — casino-themed styling
- [x] Implement Celery tasks: `send_status_email` (individual with retry), `send_mass_email` (batch)
- [x] `email_logs` table tracking — logs every send attempt (sent/failed) with error details
- [x] Added `psycopg2-binary` for sync Celery DB access
- [x] Trigger emails automatically on application status change (wired into service layer — fires Celery tasks on submit + status change)
- [x] `EmailComposer.tsx` — admin bulk status change + email UI (preview count, bulk accept/reject/waitlist with auto-emails)

---

## Phase 3: Event-Day Features

These only matter during the hackathon itself.

### 3.1 — Teams

Files: `services/api/app/domains/contestants/`, `apps/web/src/components/dashboard/TeamFinder.tsx`

- [x] Backend endpoints (all implemented with schemas, repository, service, router):
  - `POST /api/v1/teams` — create team (auto-generates invite code, creator added as leader)
  - `POST /api/v1/teams/join` — join via invite code (checks team full, already on team)
  - `GET /api/v1/teams` — browse teams with pagination + member counts
  - `GET /api/v1/teams/me` — get current user's team with members
  - `DELETE /api/v1/teams/{id}/members/me` — leave team
- [x] `TeamFinder.tsx` — browsable team list, create team, join via invite code, leave team. Wired into `dashboard/team.astro`

### 3.2 — Schedule

Files: `services/api/app/domains/events/`, `apps/web/src/components/dashboard/EventSchedule.tsx`

- [x] Backend: Full CRUD for events (admin creates/updates/deletes, all users list/get)
  - `GET /api/v1/events` — list schedule, `GET /api/v1/events/{id}` — get event
  - `POST /api/v1/events` — create (admin), `PATCH /api/v1/events/{id}` — update (admin), `DELETE /api/v1/events/{id}` — delete (admin)
- [x] `EventSchedule.tsx` — timeline view grouped by date, event types color-coded (workshop/minigame/ceremony/meal/general). Wired into `dashboard/schedule.astro`
- [x] Admin: `EventManager.tsx` — create/edit/delete events UI. Wired into `admin/contestants.astro`

### 3.3 — Announcements (Real-time)

Files: `services/api/app/domains/announcements/`, `apps/web/src/components/dashboard/AnnouncementsFeed.tsx`

- [x] Backend: `POST /api/v1/announcements` (admin only) + `GET /api/v1/announcements` (list)
- [x] Backend: `GET /api/v1/announcements/stream` — SSE endpoint using `StreamingResponse` (keepalive polling, ready for Redis pub/sub upgrade)
- [x] `AnnouncementsFeed.tsx` — live feed with SSE connection, priority-based styling (urgent=red, normal=green, low=muted), time-ago timestamps. Wired into `dashboard/index.astro`
- [x] `AnnouncementEditor.tsx` — admin compose form with priority picker (low/normal/urgent), recent announcements list. Wired into `admin/announcements.astro`
- [x] Priority levels (low/normal/urgent) with visual differentiation — color-coded borders, badges, and glow effects

### 3.4 — Food Ordering

Files: `services/api/app/domains/food/`, `apps/web/src/components/dashboard/FoodOrder.tsx`

- [x] Feature flag in Redis — `POST /food/admin/toggle` toggles ordering, `GET /food/status` checks flag, user-facing routes gated by `require_food_ordering_enabled` dependency, FoodOrder.tsx shows "kitchen closed" when disabled
- [x] Backend: `GET /api/v1/food/menu`, `POST /api/v1/food/orders`, `GET /api/v1/food/orders/me` — all implemented
- [x] Admin: manage menu items (CRUD), view all orders, update order status — endpoints added to food router (`/food/admin/menu`, `/food/admin/orders`)
- [x] `FoodOrder.tsx` — menu browser grouped by category, cart with quantity controls, order placement, order status tracking with tabs (menu/orders). Wired into `dashboard/food.astro`

---

## Phase 4: Landing Page

Can be done in parallel with backend work.

### 4.1 — Full Landing Page Build

Files: `apps/web/src/components/landing/`, `apps/web/src/pages/index.astro`

- [x] `Hero.astro` — full-viewport hero with GSAP entrance animations, floating card suit decorations, ambient glow effects, countdown timer, scroll indicator
- [x] `About.astro` — about section with `[01]` numbered header, stats grid (12h/4-member/free), "what to expect" cards (workshops/mini-games/food), GSAP scroll animations
- [x] `Schedule.astro` — timeline with `[02]` header, color-coded event types (workshop/minigame/ceremony/meal/general), vertical timeline with dots, staggered entrance animations
- [x] `Sponsors.astro` — `[03]` sponsor grid with tiered layout (Diamond/Gold/Silver), placeholder sponsors, "become a sponsor" CTA
- [x] `FAQ.astro` — `[04]` native `<details>` accordion with numbered items, rotate-45 open indicator, GSAP stagger entrance
- [x] `Footer.astro` — 3-column layout (brand/links/social), card suit decorations, progsu branding, copyright
- [x] Wire all sections into `index.astro` — Hero > About > Schedule > Sponsors > FAQ > Footer
- [x] Countdown timer to event date — live countdown in Hero with days/hours/mins/secs, updates every second
- [ ] Slot-machine animated number counters for stats (enhancement — basic stat numbers in place)
- [ ] Target: 100/100 Lighthouse, zero client JS except GSAP (GSAP is the only JS loaded)

### 4.2 — UI Component Library

Files: `apps/web/src/components/ui/`

- [ ] `Button.tsx` — flesh out variants (primary/secondary/ghost) with neon glow hover effects
- [ ] `Modal.tsx` — card-flip animation (Framer Motion)
- [ ] `Toast.tsx` — casino chip pop-in notification style
- [ ] `DataTable.tsx` — sortable, filterable, searchable table for admin views
- [ ] `Card.tsx` — enhance with betting-slip variant for status cards

---

## Phase 5: Infrastructure & Deployment

### 5.1 — AWS CDK Stacks

Files: `infra/lib/`

- [ ] `network-stack.ts` — VPC with public/private subnets, security groups
- [ ] `database-stack.ts` — RDS PostgreSQL 16 (db.t4g.micro), ElastiCache Redis (cache.t4g.micro)
- [ ] `storage-stack.ts` — S3 bucket for resumes/assets with presigned URL policy
- [ ] `email-stack.ts` — SES domain verification, production access request
- [ ] `api-stack.ts` — ECR repo, ECS Fargate service (0.5 vCPU, 1GB), ALB with HTTPS
- [ ] `monitoring-stack.ts` — CloudWatch alarms for API errors, DB connections, task queue depth

### 5.2 — CI/CD Pipeline

Files: `.github/workflows/deploy.yml`

- [ ] Uncomment and configure all deploy steps
- [ ] Set up GitHub Actions secrets: `AWS_ROLE_ARN`, `ECR_REPO`, Vercel token
- [ ] Frontend: Vercel deploy (or configure via Vercel git integration)
- [ ] Backend: Docker build → ECR push → ECS service update
- [ ] Migration step: run Alembic via ECS one-off task
- [ ] Sentry release creation + source map upload

### 5.3 — Observability

- [ ] Initialize Sentry in `app/main.py` (backend) and `astro.config.mjs` (frontend)
- [ ] Set up structured JSON logging with `structlog`
- [ ] Configure Axiom log shipping via OpenTelemetry exporter
- [ ] Instrument FastAPI + SQLAlchemy with OpenTelemetry for request tracing
- [ ] Set up Sentry alerts for error spikes

---

## Suggested Build Order (by session)

If you're tackling this across multiple coding sessions:

| Session | Focus                                          | Unlocks                        |
| ------- | ---------------------------------------------- | ------------------------------ |
| 1       | Clerk auth + DB models + first migration       | All authenticated features     |
| 2       | Application system (backend + frontend)        | People can apply               |
| 3       | Admin applicant review + email system          | Organizers can manage          |
| 4       | Landing page (full build with animations)      | Public-facing site             |
| 5       | Teams + schedule + announcements               | Event-day contestant features  |
| 6       | Food ordering + UI polish                      | Full event-day experience      |
| 7       | CDK stacks + deploy pipeline                   | Production deployment          |
| 8       | Observability + testing + hardening            | Production readiness           |

---

## Files That Don't Exist Yet (gaps from CLAUDE.md)

These are referenced in the spec but weren't part of the initial scaffold:

- ~~`services/api/app/domains/users/` — User domain~~ ✅ Done
- ~~Clerk webhook endpoint~~ ✅ Done
- ~~S3 presigned URL endpoint for resume uploads~~ ✅ Done (`app/utils/s3.py` + `POST /applications/upload-url`)
- ~~Feature flag service for food ordering toggle~~ ✅ Done (Redis flag in food router)
- ~~Email templates~~ ✅ Done (inline HTML in `utils/email.py`)
- `@sentry/astro` integration in the frontend
- OpenTelemetry + Axiom initialization code
- `structlog` logging setup
