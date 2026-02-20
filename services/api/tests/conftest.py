"""Shared test fixtures for the Hacklanta API test suite."""

import uuid
from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_session
from app.core.security import get_current_user, require_admin
from app.core.turnstile import verify_turnstile
from app.main import create_app

# ---------------------------------------------------------------------------
# In-memory SQLite for tests (avoids needing a real Postgres instance)
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = "sqlite+aiosqlite:///file::memory:?cache=shared&uri=true"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_session() -> AsyncIterator[AsyncSession]:
    async with TestSessionLocal() as session:
        yield session


# ---------------------------------------------------------------------------
# Mock auth payloads
# ---------------------------------------------------------------------------
TEST_USER_CLERK_ID = "user_test_abc123"
TEST_ADMIN_CLERK_ID = "user_test_admin456"

MOCK_USER_PAYLOAD = {
    "sub": TEST_USER_CLERK_ID,
    "metadata": {},
    "public_metadata": {},
}

MOCK_ADMIN_PAYLOAD = {
    "sub": TEST_ADMIN_CLERK_ID,
    "metadata": {"role": "admin"},
    "public_metadata": {},
}


async def override_get_current_user() -> dict:
    return MOCK_USER_PAYLOAD


async def override_require_admin() -> dict:
    return MOCK_ADMIN_PAYLOAD


async def override_verify_turnstile() -> dict:
    return {"success": True}


# ---------------------------------------------------------------------------
# App fixture
# ---------------------------------------------------------------------------
@pytest.fixture()
async def app():
    """Create a fresh app instance with dependency overrides and clean DB."""
    test_app = create_app()
    test_app.dependency_overrides[get_session] = override_get_session
    test_app.dependency_overrides[get_current_user] = override_get_current_user
    test_app.dependency_overrides[require_admin] = override_require_admin
    test_app.dependency_overrides[verify_turnstile] = override_verify_turnstile

    # Patch ARRAY columns to JSON for SQLite compatibility
    from sqlalchemy import JSON

    for table in Base.metadata.tables.values():
        for col in table.columns:
            if col.type.__class__.__name__ == "ARRAY":
                col.type = JSON()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield test_app

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    test_app.dependency_overrides.clear()


@pytest.fixture()
async def client(app) -> AsyncIterator[AsyncClient]:
    """Async HTTP client for making requests to the test app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture()
async def admin_client(app) -> AsyncIterator[AsyncClient]:
    """Client that authenticates as admin (same as client since overrides are global)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture()
async def db_session() -> AsyncIterator[AsyncSession]:
    """Direct DB session for seeding test data."""
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture()
async def seed_user(db_session):
    """Seed the test user into the database (required before application submission)."""
    from app.domains.users.models import User

    user = User(
        id=uuid.uuid4(),
        clerk_id=TEST_USER_CLERK_ID,
        email="testuser@example.com",
        first_name="Test",
        last_name="User",
        role="user",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture()
async def seed_admin(db_session):
    """Seed the admin user into the database."""
    from app.domains.users.models import User

    admin = User(
        id=uuid.uuid4(),
        clerk_id=TEST_ADMIN_CLERK_ID,
        email="admin@example.com",
        first_name="Admin",
        last_name="User",
        role="admin",
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin


# ---------------------------------------------------------------------------
# Sample application data
# ---------------------------------------------------------------------------
SAMPLE_APPLICATION = {
    "university": "Georgia State University",
    "major": "Computer Science",
    "year_of_study": "junior",
    "graduation_date": "2027-05-15",
    "phone_number": "404-555-0123",
    "email": "testuser@example.com",
    "why_attend": (
        "I want to build something amazing at Hacklanta and meet other hackers"
        " in the Atlanta area. This is my first hackathon!"
    ),
    "experience_level": "intermediate",
    "dietary_restrictions": "vegetarian",
    "tshirt_size": "L",
    "age_confirmed": True,
    "code_of_conduct_accepted": True,
    "liability_waiver_accepted": True,
    "how_did_you_hear": "progsu discord",
    "resume_sharing_opt_in": True,
    "email_opt_in": True,
    "sms_opt_in": False,
}
