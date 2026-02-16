# CLAUDE.md — Hacklanta

## Project Overview

This is the official website for **Hacklanta**, a 12-hour hackathon hosted by **progsu** (Programming Club @ Georgia State University). The site includes a high-performance marketing landing page, an applicant/contestant portal with dashboards, and an admin panel. The codebase is a monorepo with a clear frontend/backend separation.

**Domain:** Already purchased via Vercel.

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

This is a **monorepo** with three main workspaces:

```
hacklanta/
├── apps/
│   └── web/                  # Astro 5 frontend (landing + dashboards)
├── services/
│   └── api/                  # FastAPI backend
├── infra/                    # AWS CDK (TypeScript)
├── packages/
│   └── shared/               # Shared types, constants, validation schemas
├── .github/
│   └── workflows/            # CI/CD pipelines
├── docker-compose.yml        # Local dev environment
├── turbo.json                # Turborepo config
└── package.json              # Root workspace config
```

Use **Turborepo** for monorepo orchestration (`turbo dev`, `turbo build`, `turbo lint`).

---

## Tech Stack

| Layer           | Technology                                         |
| --------------- | -------------------------------------------------- |
| Frontend        | Astro 5, React 19 (islands), Tailwind CSS v4       |
| Animations      | GSAP (landing page scroll/hero), Framer Motion (dashboard UI) |
| Backend API     | FastAPI (Python 3.12+), async throughout            |
| ORM             | SQLAlchemy 2.0 (async mode)                        |
| Migrations      | Alembic                                            |
| Validation      | Pydantic v2 (API schemas)                          |
| Task Queue      | Celery + Redis                                     |
| Auth            | Clerk (React SDK frontend, Python SDK backend)     |
| Database        | PostgreSQL (AWS RDS)                                |
| Cache/Broker    | Redis (AWS ElastiCache)                            |
| Email           | AWS SES + React Email (templates)                  |
| Object Storage  | AWS S3                                             |
| Hosting (FE)    | Vercel (already have domain there) OR CloudFront+S3 |
| Hosting (API)   | AWS ECS Fargate (containerized)                    |
| IaC             | AWS CDK (TypeScript)                               |
| CI/CD           | GitHub Actions → ECR → ECS                         |
| Error Tracking  | Sentry (frontend + backend)                        |
| Logging         | Axiom + OpenTelemetry                              |
| Real-time       | Server-Sent Events (SSE) via FastAPI               |

---

## Frontend — `apps/web/`

### Framework: Astro 5 + React Islands

Astro ships zero JS by default. Interactive components (dashboards, forms, real-time feeds) are React islands hydrated with `client:load` or `client:visible`. The landing page should ship near-zero JS and score 100 on Lighthouse.

### Structure

```
apps/web/
├── astro.config.mjs
├── tailwind.config.ts
├── public/
│   └── fonts/, images/, og/
├── src/
│   ├── layouts/
│   │   ├── BaseLayout.astro       # HTML shell, meta, fonts
│   │   ├── LandingLayout.astro    # Landing page wrapper
│   │   └── DashboardLayout.astro  # Authenticated dashboard shell
│   ├── pages/
│   │   ├── index.astro            # Landing page
│   │   ├── apply.astro            # Application form page
│   │   ├── dashboard/
│   │   │   ├── index.astro        # Contestant dashboard home
│   │   │   ├── team.astro         # Team finder / team management
│   │   │   ├── schedule.astro     # Event schedule + workshops
│   │   │   └── food.astro         # Food ordering during event
│   │   └── admin/
│   │       ├── index.astro        # Admin overview
│   │       ├── applicants.astro   # Review/accept/reject applicants
│   │       ├── contestants.astro  # Manage accepted contestants
│   │       ├── announcements.astro
│   │       └── emails.astro       # Mass email composer
│   ├── components/
│   │   ├── landing/               # Static Astro components + GSAP
│   │   │   ├── Hero.astro
│   │   │   ├── About.astro
│   │   │   ├── Schedule.astro
│   │   │   ├── Sponsors.astro
│   │   │   ├── FAQ.astro
│   │   │   └── Footer.astro
│   │   ├── dashboard/             # React islands (client:load)
│   │   │   ├── ApplicationForm.tsx
│   │   │   ├── ApplicationStatus.tsx
│   │   │   ├── TeamFinder.tsx
│   │   │   ├── EventSchedule.tsx
│   │   │   ├── FoodOrder.tsx
│   │   │   └── AnnouncementsFeed.tsx
│   │   ├── admin/                 # React islands (client:load)
│   │   │   ├── ApplicantTable.tsx
│   │   │   ├── ApplicantReview.tsx
│   │   │   ├── EmailComposer.tsx
│   │   │   ├── AnnouncementEditor.tsx
│   │   │   └── StatsOverview.tsx
│   │   └── ui/                    # Shared UI primitives
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── Badge.tsx
│   │       ├── DataTable.tsx
│   │       └── Toast.tsx
│   ├── lib/
│   │   ├── api.ts                 # Typed API client (fetch wrapper)
│   │   ├── clerk.ts               # Clerk config
│   │   └── sse.ts                 # SSE client hook for real-time
│   └── styles/
│       └── global.css             # Tailwind directives + custom CSS
```

### Landing Page Design Guidelines

The landing page must feel premium and high-energy — like an underground hacker casino. See the **Branding & Theme** section above for the full design language.

- **Hero section:** Full-viewport, animated (GSAP ScrollTrigger). Dark base with neon casino glow effects. Animated text reveals (slot-machine style). Poker chip / card motifs. Optionally a 3D element (Three.js/Spline) — e.g. a spinning poker chip, floating cards, or a neon roulette wheel. Prominent CTA: "DEAL ME IN" / "$ ante up" style.
- **Scroll animations:** Sections fade/slide in on scroll using GSAP ScrollTrigger. Card-dealing or chip-stacking entrance animations. Smooth, performant, 60fps.
- **Typography:** Monospace (JetBrains Mono / Fira Code) for terminal elements. Bold sans-serif (Satoshi / Inter / Geist) for headings. Neon green or gold for accent numbers/stats.
- **Color palette:** See Branding section. Near-black base, neon green primary, gold accent, hot pink secondary. Glow effects on accent elements.
- **Sections:** Hero → About Hacklanta → Schedule/Timeline → Prizes → Sponsors → FAQ → Footer. Keep progsu's numbered section style (`[01]`, `[02]`) and tag labels (`// section subtitle`).
- **Performance:** All landing page content is static Astro (zero client JS). GSAP loaded only for animations. Images optimized with Astro's `<Image />` component. Target 100/100 Lighthouse.
- **Stats/Counters:** Use slot-machine-style animated number counters for stats (applicant count, prize pool, team count).

### Dashboard & Admin Design Guidelines

- Maintain the dark theme and terminal motifs from the landing page throughout the dashboard.
- Use Framer Motion for transitions (page transitions, card-flip modal animations, list reordering).
- "Betting slip" style for application status cards and food order receipts.
- DataTable components for applicant/contestant lists with sorting, filtering, search.
- Toast notifications styled as casino chip / card pop-ins for actions (accepted applicant, sent email, etc.).
- Real-time announcement feed via SSE.
- Leaderboard/scoreboard aesthetic for minigame results and team standings during the event.

### API Client

Create a typed fetch wrapper in `lib/api.ts` that:
- Automatically attaches Clerk session tokens via `getToken()`.
- Has typed request/response generics matching Pydantic schemas.
- Handles errors consistently with toast notifications.
- Base URL configurable via env var `PUBLIC_API_URL`.

---

## Backend API — `services/api/`

### Framework: FastAPI (Python 3.12+)

Fully async. All database calls use SQLAlchemy async sessions. Pydantic v2 for all request/response models.

### Structure

```
services/api/
├── Dockerfile
├── pyproject.toml              # Dependencies (use uv or poetry)
├── alembic/
│   ├── alembic.ini
│   └── versions/               # Migration files
├── app/
│   ├── main.py                 # FastAPI app factory, middleware, lifespan
│   ├── core/
│   │   ├── config.py           # Settings via pydantic-settings (env vars)
│   │   ├── database.py         # Async engine, session factory
│   │   ├── redis.py            # Redis client
│   │   ├── security.py         # Clerk token verification, role checks
│   │   └── middleware.py       # CORS, request logging, rate limiting
│   ├── domains/
│   │   ├── applicants/
│   │   │   ├── router.py       # POST /apply, GET /applications/{id}, etc.
│   │   │   ├── schemas.py      # Pydantic models
│   │   │   ├── service.py      # Business logic
│   │   │   ├── repository.py   # DB queries (SQLAlchemy)
│   │   │   └── models.py       # SQLAlchemy ORM models
│   │   ├── contestants/
│   │   │   ├── router.py       # GET /me, GET /team, POST /team/join, etc.
│   │   │   ├── schemas.py
│   │   │   ├── service.py
│   │   │   ├── repository.py
│   │   │   └── models.py
│   │   ├── events/
│   │   │   ├── router.py       # GET /schedule, GET /events/{id}
│   │   │   ├── schemas.py
│   │   │   ├── service.py
│   │   │   ├── repository.py
│   │   │   └── models.py
│   │   ├── food/
│   │   │   ├── router.py       # GET /menu, POST /orders, GET /orders/me
│   │   │   ├── schemas.py
│   │   │   ├── service.py
│   │   │   ├── repository.py
│   │   │   └── models.py
│   │   ├── announcements/
│   │   │   ├── router.py       # GET /announcements (SSE), POST /announcements
│   │   │   ├── schemas.py
│   │   │   ├── service.py
│   │   │   ├── repository.py
│   │   │   └── models.py
│   │   └── admin/
│   │       ├── router.py       # Admin-only endpoints
│   │       ├── schemas.py
│   │       └── service.py
│   ├── workers/
│   │   ├── celery_app.py       # Celery configuration
│   │   ├── email_tasks.py      # Send acceptance emails, mass emails
│   │   └── notification_tasks.py
│   └── utils/
│       ├── email.py            # SES client wrapper
│       └── pagination.py       # Cursor/offset pagination helpers
```

### API Design Conventions

- All routes versioned under `/api/v1/`.
- Use dependency injection for database sessions, current user, admin checks.
- Return consistent response envelopes: `{ "data": ..., "meta": { "total": N, "page": N } }`.
- Use HTTP status codes correctly (201 for creation, 204 for deletion, 422 for validation errors).
- Auto-generate OpenAPI docs at `/docs` (FastAPI built-in).

### Auth Flow

1. Frontend uses Clerk's `<SignIn />` / `<SignUp />` React components.
2. Clerk issues a JWT session token.
3. Frontend sends `Authorization: Bearer <token>` on every API request.
4. FastAPI middleware verifies the token using Clerk's Python SDK (`clerk.verify_token()`).
5. Middleware extracts `user_id` and attaches it to the request state.
6. Admin endpoints additionally check for `admin` role via Clerk metadata.
7. Clerk webhooks (`user.created`, `user.updated`) sync user data to the local PostgreSQL `users` table so the API can JOIN user data in queries without calling Clerk's API.

### Key Dependencies (FastAPI)

```
fastapi
uvicorn[standard]
sqlalchemy[asyncio]
asyncpg                   # async PostgreSQL driver
alembic
pydantic>=2.0
pydantic-settings
celery[redis]
redis
httpx                     # async HTTP client (for Clerk SDK, etc.)
clerk-backend-api         # Clerk Python SDK
sentry-sdk[fastapi]
opentelemetry-api
opentelemetry-sdk
opentelemetry-instrumentation-fastapi
boto3                     # AWS SES
python-multipart          # file uploads
```

---

## Data Model (PostgreSQL)

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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'pending',  -- 'pending' | 'accepted' | 'rejected' | 'waitlisted'
    -- Application fields:
    university VARCHAR NOT NULL,
    major VARCHAR NOT NULL,
    year_of_study VARCHAR NOT NULL,
    graduation_date DATE,
    resume_url VARCHAR,             -- S3 presigned URL
    github_url VARCHAR,
    linkedin_url VARCHAR,
    why_attend TEXT,
    experience_level VARCHAR,       -- 'beginner' | 'intermediate' | 'advanced'
    dietary_restrictions VARCHAR,
    tshirt_size VARCHAR,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    invite_code VARCHAR UNIQUE NOT NULL,  -- short code for team joining
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

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT,
    event_type VARCHAR NOT NULL,    -- 'workshop' | 'minigame' | 'ceremony' | 'meal' | 'general'
    location VARCHAR,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    capacity INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    body TEXT NOT NULL,
    priority VARCHAR DEFAULT 'normal',  -- 'low' | 'normal' | 'urgent'
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE food_menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR,               -- 'entree' | 'side' | 'drink' | 'dessert'
    dietary_tags VARCHAR[],          -- ['vegetarian', 'vegan', 'gluten-free', 'halal']
    available BOOLEAN DEFAULT TRUE,
    max_quantity INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE food_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'placed',  -- 'placed' | 'preparing' | 'ready' | 'picked_up'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE food_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES food_orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES food_menu_items(id),
    quantity INT DEFAULT 1
);

CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    template VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'queued',  -- 'queued' | 'sent' | 'failed'
    sent_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

All timestamp columns should use `TIMESTAMPTZ`. Use Alembic to generate and manage migrations from the SQLAlchemy models — never write raw SQL migrations by hand.

---

## Infrastructure — `infra/`

### AWS CDK (TypeScript)

```
infra/
├── bin/
│   └── infra.ts                # CDK app entry
├── lib/
│   ├── network-stack.ts        # VPC, subnets, security groups
│   ├── database-stack.ts       # RDS PostgreSQL, ElastiCache Redis
│   ├── api-stack.ts            # ECS Fargate service, ALB, ECR repo
│   ├── storage-stack.ts        # S3 buckets (resumes, assets)
│   ├── email-stack.ts          # SES configuration, verified domain
│   └── monitoring-stack.ts     # CloudWatch alarms, basic infra monitoring
├── cdk.json
├── tsconfig.json
└── package.json
```

### AWS Resources

| Resource              | Service              | Config                                      |
| --------------------- | -------------------- | ------------------------------------------- |
| API hosting           | ECS Fargate          | 0.5 vCPU, 1GB RAM, auto-scale 1-4 tasks    |
| Load balancer         | ALB                  | HTTPS termination, health checks            |
| Container registry    | ECR                  | API Docker images                           |
| Database              | RDS PostgreSQL 16    | db.t4g.micro, Multi-AZ off (cost saving)    |
| Cache / Task broker   | ElastiCache Redis    | cache.t4g.micro, single node               |
| Object storage        | S3                   | Resumes, assets, email templates            |
| Email                 | SES                  | Verified domain, production access          |
| Secrets               | Secrets Manager      | DB creds, Clerk keys, API keys              |
| DNS (if not Vercel)   | Route 53             | Domain → CloudFront / ALB                   |
| CDN (if not Vercel)   | CloudFront           | Frontend static assets                      |

### Environment Variables

**Frontend (`apps/web/.env`):**
```
PUBLIC_API_URL=https://api.yourdomain.com
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
PUBLIC_SENTRY_DSN=...
```

**Backend (`services/api/.env`):**
```
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/hackathon
REDIS_URL=redis://host:6379/0
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
AWS_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
S3_BUCKET_NAME=hacklanta-uploads
SENTRY_DSN=...
AXIOM_TOKEN=...
AXIOM_DATASET=hacklanta-api
CORS_ORIGINS=https://yourdomain.com
```

---

## Observability

### Sentry (Error Tracking)
- Install `@sentry/astro` for the frontend, `sentry-sdk[fastapi]` for the backend.
- Configure source maps upload in CI for readable stack traces.
- Set up Sentry alerts for new error spikes.

### Axiom (Logging + Metrics)
- Structured JSON logging from FastAPI using `structlog` or Python's `logging` with JSON formatter.
- Ship logs to Axiom via their Python SDK or OpenTelemetry exporter.
- Log: every API request (method, path, status, latency, user_id), all Celery task executions, all email send attempts.

### OpenTelemetry (Tracing)
- Instrument FastAPI with `opentelemetry-instrumentation-fastapi`.
- Instrument SQLAlchemy with `opentelemetry-instrumentation-sqlalchemy`.
- Export traces to Axiom (they accept OTLP).
- This produces end-to-end request traces: HTTP → service → DB.

---

## CI/CD — `.github/workflows/`

### Pipeline: `deploy.yml`

Trigger on push to `main`:

1. **Lint + Type Check:** `turbo lint` (ESLint for frontend, Ruff for Python).
2. **Test:** `turbo test` (Vitest for frontend, Pytest for API).
3. **Build Frontend:** `turbo build --filter=web`, deploy to Vercel via Vercel CLI or git integration.
4. **Build API Image:** Docker build `services/api/`, push to ECR.
5. **Deploy API:** Update ECS service to pull new image.
6. **Run Migrations:** Execute Alembic migrations against RDS (via a one-off ECS task or CI step with DB access).
7. **Sentry Release:** Create Sentry release and upload source maps.

### Branch Strategy

- `main` → production
- `staging` → staging environment (optional, same pipeline targeting staging ECS/DB)
- Feature branches → PR with lint/test checks only

---

## Local Development

### `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: hackathon
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: ./services/api
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ports:
      - "8000:8000"
    env_file: ./services/api/.env.local
    depends_on:
      - postgres
      - redis
    volumes:
      - ./services/api:/app

  celery-worker:
    build: ./services/api
    command: celery -A app.workers.celery_app worker --loglevel=info
    env_file: ./services/api/.env.local
    depends_on:
      - postgres
      - redis
    volumes:
      - ./services/api:/app

volumes:
  pgdata:
```

Run `turbo dev` in root to start the Astro frontend dev server alongside docker-compose for the backend.

### Python Tooling

**Always use `uv` instead of raw `python`/`pip`/`python3` commands.** The project uses `uv` as the Python package manager and runner.

- Run Python scripts: `uv run python script.py`
- Run tools: `uv run ruff check app/`, `uv run pytest`
- Install dependencies: `uv sync` or `uv sync --all-extras` (to include dev deps)
- Add a dependency: `uv add <package>`
- Never use `python`, `python3`, or `pip` directly — they may not resolve to the correct virtualenv

---

## Modularity & Parallel Safety

The architecture enforces clean separation across workspaces to avoid coupling:

- **`apps/web/`** — All frontend code. Depends on the API only through the typed client in `lib/api.ts`.
- **`services/api/`** — All backend code. Each domain (`applicants/`, `contestants/`, `events/`, etc.) is self-contained with its own router, schemas, service, repository, and models. Domain folders should not import from each other except through shared utilities in `core/`.
- **`infra/`** — All AWS CDK stacks. No application code here.

The contract between frontend and backend is the OpenAPI schema auto-generated by FastAPI at `/docs`. When building frontend features, reference the backend's Pydantic schemas to ensure type alignment.

---

## Key Implementation Notes

1. **Clerk Webhooks:** Set up a `/api/v1/webhooks/clerk` endpoint early. Verify the webhook signature using `svix` (Clerk uses Svix for webhook delivery). Sync `user.created` and `user.updated` events to the local `users` table. This is critical — without it, the API can't associate requests with user data.

2. **SSE for Real-Time:** Use FastAPI's `StreamingResponse` with `text/event-stream` content type for the announcements feed. The frontend subscribes via `EventSource`. This avoids the complexity of WebSocket connection management for what is a unidirectional data flow.

3. **Food Ordering:** This only activates during the event. Use a feature flag (simple boolean in Redis or a DB config table) that admins toggle on when dinner service starts. The frontend checks this flag and shows/hides the food ordering UI.

4. **Email Templates:** Build email templates with React Email in a shared package or within the API's email utility. Templates for: application received, acceptance, rejection, waitlist, announcements. Render to HTML and send via SES through Celery tasks.

5. **Resume Uploads:** Use S3 presigned URLs. The flow: frontend requests a presigned upload URL from the API → API generates it via boto3 → frontend uploads directly to S3 → frontend sends the S3 key back to the API to store in the application record. Do not stream file uploads through the API server.

6. **Team Finder:** Accepted contestants can create a team (generates a short invite code) or browse teams looking for members. Team profiles include: team name, description, member list, what skills they're looking for. Keep it simple — this doesn't need to be a matching algorithm, just a browsable list with filters.

7. **Admin Bulk Actions:** The admin applicant review page should support bulk accept/reject. This fires a Celery task that processes the batch and sends corresponding emails. Show progress via polling or SSE.
