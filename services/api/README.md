# Hacklanta API

FastAPI backend — fully async with SQLAlchemy 2.0 and Pydantic v2.

## Stack

- **FastAPI** — Async Python web framework
- **SQLAlchemy 2.0** — Async ORM with asyncpg driver
- **Pydantic v2** — Request/response validation
- **Alembic** — Database migrations (async)
- **Celery + Redis** — Background task queue
- **Clerk** — Auth token verification
- **AWS SES** — Transactional email
- **uv** — Package manager

## Structure

```
app/
├── main.py                 # App factory, middleware, lifespan
├── core/
│   ├── config.py           # Settings (pydantic-settings)
│   ├── database.py         # Async engine + session
│   ├── redis.py            # Redis client
│   ├── security.py         # Clerk token verification
│   └── middleware.py       # Request logging, rate limiting
├── domains/
│   ├── applicants/         # Applications CRUD
│   ├── contestants/        # Teams + contestant management
│   ├── events/             # Schedule + events
│   ├── food/               # Food ordering (event day)
│   ├── announcements/      # SSE real-time announcements
│   └── admin/              # Admin-only endpoints
├── workers/
│   ├── celery_app.py       # Celery config
│   ├── email_tasks.py      # Email sending tasks
│   └── notification_tasks.py
└── utils/
    ├── email.py            # SES wrapper
    └── pagination.py       # Pagination helpers
```

Each domain follows the pattern: `router.py`, `schemas.py`, `service.py`, `repository.py`, `models.py`.

## Development

### Setup

```bash
# Create venv and install dependencies
uv venv
uv pip install -e ".[dev]"

# Start Postgres + Redis
docker compose up -d postgres redis

# Copy env file
cp .env.example .env
```

### Run

```bash
# Activate venv
source .venv/bin/activate

# Start API server with hot reload
uvicorn app.main:app --reload

# In another terminal — start Celery worker
celery -A app.workers.celery_app worker --loglevel=info
```

Or via Docker Compose (from repo root):

```bash
docker compose up api celery-worker
```

### Endpoints

- Health check: `GET /api/v1/health`
- OpenAPI docs: `GET /docs`
- OpenAPI schema: `GET /api/v1/openapi.json`

All domain routes are prefixed with `/api/v1/`.

## Commands

| Command                 | Description               |
| ----------------------- | ------------------------- |
| `ruff check .`          | Lint                      |
| `ruff check --fix .`    | Lint and auto-fix         |
| `ruff format .`         | Format code               |
| `ruff format --check .` | Check formatting          |
| `pytest`                | Run tests                 |
| `alembic upgrade head`  | Run all migrations        |
| `alembic downgrade -1`  | Rollback last migration   |
| `alembic revision --autogenerate -m "description"` | Generate migration |

## Environment Variables

Copy `.env.example` to `.env`. Key variables:

| Variable              | Description                           |
| --------------------- | ------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection (asyncpg)       |
| `REDIS_URL`           | Redis connection                      |
| `CLERK_SECRET_KEY`    | Clerk backend secret                  |
| `CLERK_WEBHOOK_SECRET`| Clerk webhook signing secret          |
| `AWS_REGION`          | AWS region for SES/S3                 |
| `AWS_SES_FROM_EMAIL`  | Sender email for transactional mail   |
| `S3_BUCKET_NAME`      | S3 bucket for resume uploads          |
| `CORS_ORIGINS`        | Allowed CORS origins (JSON array)     |
| `SENTRY_DSN`          | Sentry DSN (optional)                 |

## Docker

Build the API image:

```bash
docker build -t hacklanta-api .
```

The Dockerfile uses Python 3.12-slim with uv for dependency installation.
