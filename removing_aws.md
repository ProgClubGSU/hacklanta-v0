# Removing AWS — Implementation Plan

## Background
Hacklanta wants to completely migrate away from the AWS ecosystem to eliminate infrastructure overhead and reduce costs. This involves moving the database to Supabase, swapping out S3 for Supabase Storage, eliminating the complex AWS CDK infrastructure, and removing Celery/Redis to make serverless or PaaS hosting (e.g., Fly.io, Railway, Render) fully free.

## User Review Required
> [!IMPORTANT]
> **To proceed with this plan**, we will replace the heavy Celery/Redis background worker queue with FastAPI's native `BackgroundTasks`. This implies that background jobs (like sending emails) will run in the exact same process as the API. For a hackathon, this is perfectly scalable and entirely eliminates the need to pay for a separate worker server or Redis instance. Please confirm if this is acceptable!

---

## Proposed Changes

### Phase 1: Environment & Config Updates
Swap out the AWS configuration variables for Supabase in our core app settings.

#### [MODIFY] [config.py](file:///c:/Users/hp/Desktop/CS/hacklanta-v0/services/api/app/core/config.py)
- **Remove:** `aws_region`, `s3_bucket_name`.
- **Add:** `supabase_url`, `supabase_service_key`.

#### [MODIFY] [.env.example](file:///c:/Users/hp/Desktop/CS/hacklanta-v0/services/api/.env.example)
- Update `DATABASE_URL` placeholder to show the Supabase connection string.
- Remove AWS variables and add `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.

---

### Phase 2: Resume Storage (S3 → Supabase Storage)
Replace `boto3` with standard HTTP requests (or the Supabase SDK) to generate pre-signed upload URLs for resumes.

#### [MODIFY] [pyproject.toml](file:///c:/Users/hp/Desktop/CS/hacklanta-v0/services/api/pyproject.toml)
- Remove `boto3`.
- (Optional) Add `supabase` python client sdk.

#### [MODIFY] [s3.py](file:///c:/Users/hp/Desktop/CS/hacklanta-v0/services/api/app/utils/s3.py) -> `storage.py`
- Rename the file/module from `s3` to `storage`.
- Rewrite `generate_upload_url()` and `generate_download_url()` to interact with the Supabase Storage API using the `supabase_service_key`. 

---

### Phase 3: Background Tasks Simplicity (Celery Removal)
To host the API for free/cheap on platforms like Render or Fly.io, we need to eliminate the requirement for a separate Redis database and Celery worker container. 

#### [DELETE] `services/api/app/workers/`
- Delete the entire worker directory (`celery_app.py`, `email_tasks.py`, etc.).

#### [MODIFY] [pyproject.toml](file:///c:/Users/hp/Desktop/CS/hacklanta-v0/services/api/pyproject.toml)
- Remove `celery` and `redis` from the dependencies.

#### [MODIFY] Various Routers (e.g., webhook, users)
- Replace `.delay()` Celery calls with FastAPI native `BackgroundTasks`. 
- For instance, when the Clerk webhook fires to sync a user, instead of dispatching to Celery, use `background_tasks.add_task(send_welcome_email, user.email)`.

#### [MODIFY] [main.py](file:///c:/Users/hp/Desktop/CS/hacklanta-v0/services/api/app/main.py) & [database.py](file:///c:/Users/hp/Desktop/CS/hacklanta-v0/services/api/app/core/database.py)
- Remove the Redis initialization blocks from the FastAPI `lifespan` scope.

---

### Phase 4: Infrastructure Deletion
Completely erase the heavy AWS CDK code.

#### [DELETE] `infra/`
- Remove the entire CDK infrastructure folder representing network, API, monitoring, and database AWS stacks.

#### [MODIFY] [docker-compose.yml](file:///c:/Users/hp/Desktop/CS/hacklanta-v0/docker-compose.yml)
- Remove the `redis` and `celery-worker` service blocks so local development relies only on `postgres` and `api`.

#### [MODIFY] [README.md](file:///c:/Users/hp/Desktop/CS/hacklanta-v0/services/api/README.md)
- Remove references to AWS SES, Celery, and Redis in the documentation. 
- Update the startup instructions to no longer mention starting the celery worker.

---

## Verification Plan

### Automated Tests
Run the existing test suite:
- `cd services/api && uv run pytest -v` (Check that tests pass without Redis/Celery mock failures).

### Manual Verification
1. Verify Supabase DB connection using `uv run alembic upgrade head`. 
2. Verify FastAPI `BackgroundTasks` executes the email tasks without crashing the event loop using `docker compose up api postgres`.
3. Try generating an upload link for a resume through the API to ensure Supabase storage properly replaced S3.
