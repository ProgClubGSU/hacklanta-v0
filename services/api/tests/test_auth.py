"""Tests for authentication and authorization boundaries."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import get_current_user, require_admin
from app.core.turnstile import verify_turnstile
from app.main import create_app
from tests.conftest import override_get_session, override_verify_turnstile


@pytest.fixture()
async def unauthed_client(app):
    """Client with NO auth override — simulates unauthenticated request."""
    from fastapi import HTTPException, status

    async def fail_auth():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    app.dependency_overrides[get_current_user] = fail_auth
    # require_admin depends on get_current_user, so it'll also fail

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture()
async def non_admin_app():
    """App where user is authenticated but NOT admin."""
    from app.core.database import Base, get_session
    from tests.conftest import MOCK_USER_PAYLOAD

    test_app = create_app()
    test_app.dependency_overrides[get_session] = override_get_session
    test_app.dependency_overrides[get_current_user] = lambda: MOCK_USER_PAYLOAD
    test_app.dependency_overrides[verify_turnstile] = override_verify_turnstile

    # Override require_admin to raise 403
    from fastapi import HTTPException, status

    async def fail_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    test_app.dependency_overrides[require_admin] = fail_admin

    from sqlalchemy.ext.asyncio import create_async_engine

    eng = create_async_engine("sqlite+aiosqlite:///file::memory:?cache=shared&uri=true")
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield test_app

    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await eng.dispose()


@pytest.fixture()
async def non_admin_client(non_admin_app):
    transport = ASGITransport(app=non_admin_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ── 401 Unauthenticated ───────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_unauthenticated_submit_application(unauthed_client):
    resp = await unauthed_client.post("/api/v1/applications", json={})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_unauthenticated_get_my_application(unauthed_client):
    resp = await unauthed_client.get("/api/v1/applications/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_unauthenticated_list_teams(unauthed_client):
    resp = await unauthed_client.get("/api/v1/teams")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_unauthenticated_list_events(unauthed_client):
    resp = await unauthed_client.get("/api/v1/events")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_unauthenticated_food_status(unauthed_client):
    resp = await unauthed_client.get("/api/v1/food/status")
    assert resp.status_code == 401


# ── 403 Non-Admin ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_non_admin_list_applications(non_admin_client):
    """Regular user cannot list all applications (admin-only)."""
    resp = await non_admin_client.get("/api/v1/applications")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_non_admin_create_event(non_admin_client):
    """Regular user cannot create events (admin-only)."""
    resp = await non_admin_client.post("/api/v1/events", json={"title": "Hack"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_non_admin_create_announcement(non_admin_client):
    """Regular user cannot create announcements (admin-only)."""
    resp = await non_admin_client.post(
        "/api/v1/announcements", json={"title": "Hey", "body": "Test"}
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_non_admin_toggle_food(non_admin_client):
    """Regular user cannot toggle food ordering (admin-only)."""
    resp = await non_admin_client.post("/api/v1/food/admin/toggle")
    assert resp.status_code == 403


# ── Health check is public ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_health_is_public(unauthed_client):
    """Health check should work without auth."""
    resp = await unauthed_client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
