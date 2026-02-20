from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.domains.announcements.router import router as announcements_router
from app.domains.applicants.router import router as applicants_router
from app.domains.contestants.router import router as teams_router
from app.domains.events.router import router as events_router
from app.domains.food.router import router as food_router
from app.domains.users.router import router as users_router


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    # Startup: initialize DB pool, Redis connection, etc.
    yield
    # Shutdown: close connections


def create_app() -> FastAPI:
    app = FastAPI(
        title="Hacklanta API",
        version="0.1.0",
        docs_url="/docs" if settings.debug else None,
        openapi_url="/api/v1/openapi.json" if settings.debug else None,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/v1/health")
    async def health_check() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(users_router, prefix="/api/v1")
    app.include_router(applicants_router, prefix="/api/v1")
    app.include_router(teams_router, prefix="/api/v1")
    app.include_router(events_router, prefix="/api/v1")
    app.include_router(announcements_router, prefix="/api/v1")
    app.include_router(food_router, prefix="/api/v1")
    # app.include_router(admin_router, prefix="/api/v1")

    return app


app = create_app()
