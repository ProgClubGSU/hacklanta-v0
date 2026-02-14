# Hacklanta

A 12-hour hackathon hosted by [progsu](https://progsu.com) (Programming Club @ Georgia State University). Casino/poker themed hacker experience.

## Architecture

This is a monorepo with three main workspaces:

```
hacklanta/
├── apps/web/          # Astro 5 + React 19 + Tailwind v4 frontend
├── services/api/      # FastAPI (Python 3.12+) backend
├── infra/             # AWS CDK (TypeScript) infrastructure
├── packages/shared/   # Shared constants and types
├── .github/workflows/ # CI/CD pipelines
└── docker-compose.yml # Local dev environment
```

| Layer      | Tech                                              |
| ---------- | ------------------------------------------------- |
| Frontend   | Astro 5, React 19 (islands), Tailwind CSS v4      |
| Animations | GSAP (landing), Framer Motion (dashboard)          |
| Backend    | FastAPI, SQLAlchemy 2.0 (async), Pydantic v2       |
| Auth       | Clerk                                              |
| Database   | PostgreSQL 16                                      |
| Cache      | Redis 7                                            |
| Task Queue | Celery + Redis                                     |
| Email      | AWS SES                                            |
| Infra      | AWS CDK, ECS Fargate, RDS, ElastiCache             |
| CI/CD      | GitHub Actions                                     |

## Prerequisites

- **Node.js** 22+ (via [nvm](https://github.com/nvm-sh/nvm))
- **pnpm** 10+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Python** 3.12+
- **uv** ([docs](https://docs.astral.sh/uv/))
- **Docker** (for local Postgres + Redis)

## Quick Start

### 1. Install dependencies

```bash
# Node workspaces
pnpm install

# Python API
cd services/api
uv venv
uv pip install -e ".[dev]"
cd ../..
```

### 2. Start infrastructure

```bash
docker compose up -d postgres redis
```

### 3. Set up environment variables

```bash
cp apps/web/.env.example apps/web/.env
cp services/api/.env.example services/api/.env
```

Edit both `.env` files with your Clerk keys and any other secrets.

### 4. Run the dev servers

```bash
# Frontend (Astro on :4321)
pnpm turbo dev --filter=@hacklanta/web

# Backend (uvicorn on :8000) — in a separate terminal
cd services/api
.venv/bin/uvicorn app.main:app --reload
```

Or run the full stack:

```bash
# Frontend
pnpm turbo dev --filter=@hacklanta/web

# Backend + workers via Docker
docker compose up
```

### 5. Verify

- Landing page: http://localhost:4321
- API health check: http://localhost:8000/api/v1/health
- API docs: http://localhost:8000/docs

## Commands

| Command             | Description                                |
| ------------------- | ------------------------------------------ |
| `pnpm turbo dev`    | Start all dev servers                      |
| `pnpm turbo build`  | Build all workspaces                       |
| `pnpm turbo lint`   | Lint all workspaces                        |
| `pnpm turbo test`   | Run all tests                              |
| `pnpm format`       | Format code with Prettier                  |
| `pnpm format:check` | Check formatting                           |

### Backend-specific

Run these from `services/api/` with the venv activated:

| Command                    | Description            |
| -------------------------- | ---------------------- |
| `ruff check .`             | Lint Python code       |
| `ruff format .`            | Format Python code     |
| `pytest`                   | Run API tests          |
| `alembic upgrade head`     | Run DB migrations      |
| `alembic revision --autogenerate -m "msg"` | Generate migration |

## Project Structure

See [CLAUDE.md](./CLAUDE.md) for the full architecture spec, branding guidelines, data model, and implementation notes.

### Workspaces

- **[apps/web/](./apps/web/)** — Frontend application
- **[services/api/](./services/api/)** — Backend API
- **[infra/](./infra/)** — AWS infrastructure
- **[packages/shared/](./packages/shared/)** — Shared types and constants

## Branch Strategy

- `main` — production
- `staging` — staging environment (optional)
- Feature branches — PR with lint/test checks
