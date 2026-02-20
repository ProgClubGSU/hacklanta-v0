"""E2E tests for the application submission and review flow."""

import pytest

from tests.conftest import SAMPLE_APPLICATION

# ── Submit Application ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_submit_application(client, seed_user):
    """Happy path: submit a valid application."""
    resp = await client.post("/api/v1/applications", json=SAMPLE_APPLICATION)
    assert resp.status_code == 201

    data = resp.json()
    assert data["status"] == "pending"
    assert data["university"] == "Georgia State University"
    assert data["experience_level"] == "intermediate"
    assert data["age_confirmed"] is True


@pytest.mark.asyncio
async def test_submit_duplicate_application(client, seed_user):
    """Cannot submit two applications."""
    resp1 = await client.post("/api/v1/applications", json=SAMPLE_APPLICATION)
    assert resp1.status_code == 201

    resp2 = await client.post("/api/v1/applications", json=SAMPLE_APPLICATION)
    assert resp2.status_code == 409
    assert "already submitted" in resp2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_submit_application_missing_fields(client, seed_user):
    """Validation error for missing required fields."""
    resp = await client.post("/api/v1/applications", json={"university": "GSU"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_submit_application_why_attend_too_short(client, seed_user):
    """why_attend must be at least 50 chars."""
    bad_data = {**SAMPLE_APPLICATION, "why_attend": "Too short"}
    resp = await client.post("/api/v1/applications", json=bad_data)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_submit_application_invalid_year(client, seed_user):
    """year_of_study must be a valid literal."""
    bad_data = {**SAMPLE_APPLICATION, "year_of_study": "postdoc"}
    resp = await client.post("/api/v1/applications", json=bad_data)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_submit_application_user_not_synced(client):
    """404 if user hasn't been synced from Clerk yet (no seed_user)."""
    resp = await client.post("/api/v1/applications", json=SAMPLE_APPLICATION)
    assert resp.status_code == 404
    assert "synced" in resp.json()["detail"].lower()


# ── Get My Application ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_my_application(client, seed_user):
    """Get own application after submitting."""
    await client.post("/api/v1/applications", json=SAMPLE_APPLICATION)

    resp = await client.get("/api/v1/applications/me")
    assert resp.status_code == 200
    assert resp.json()["university"] == "Georgia State University"


@pytest.mark.asyncio
async def test_get_my_application_not_found(client, seed_user):
    """404 if user hasn't submitted an application."""
    resp = await client.get("/api/v1/applications/me")
    assert resp.status_code == 404


# ── Edit My Application ───────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_edit_pending_application(client, seed_user):
    """Can edit a pending application."""
    await client.post("/api/v1/applications", json=SAMPLE_APPLICATION)

    resp = await client.patch("/api/v1/applications/me", json={"major": "Data Science"})
    assert resp.status_code == 200
    assert resp.json()["major"] == "Data Science"


@pytest.mark.asyncio
async def test_edit_accepted_application_blocked(client, seed_user, seed_admin, admin_client):
    """Cannot edit an accepted application."""
    create_resp = await client.post("/api/v1/applications", json=SAMPLE_APPLICATION)
    app_id = create_resp.json()["id"]

    # Admin accepts it
    await admin_client.patch(f"/api/v1/applications/{app_id}", json={"status": "accepted"})

    # User tries to edit
    resp = await client.patch("/api/v1/applications/me", json={"major": "Data Science"})
    assert resp.status_code == 403
    assert "cannot edit" in resp.json()["detail"].lower()


# ── Admin: Review Application ─────────────────────────────────────────────


@pytest.mark.asyncio
async def test_admin_list_applications(client, seed_user, seed_admin, admin_client):
    """Admin can list all applications."""
    await client.post("/api/v1/applications", json=SAMPLE_APPLICATION)

    resp = await admin_client.get("/api/v1/applications")
    assert resp.status_code == 200
    data = resp.json()
    assert data["meta"]["total"] >= 1
    assert len(data["data"]) >= 1


@pytest.mark.asyncio
async def test_admin_accept_application(client, seed_user, seed_admin, admin_client):
    """Admin can accept an application."""
    create_resp = await client.post("/api/v1/applications", json=SAMPLE_APPLICATION)
    app_id = create_resp.json()["id"]

    resp = await admin_client.patch(f"/api/v1/applications/{app_id}", json={"status": "accepted"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"
    assert resp.json()["reviewed_by"] is not None


@pytest.mark.asyncio
async def test_admin_reject_application(client, seed_user, seed_admin, admin_client):
    """Admin can reject an application."""
    create_resp = await client.post("/api/v1/applications", json=SAMPLE_APPLICATION)
    app_id = create_resp.json()["id"]

    resp = await admin_client.patch(f"/api/v1/applications/{app_id}", json={"status": "rejected"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "rejected"


@pytest.mark.asyncio
async def test_admin_bulk_update(client, seed_user, seed_admin, admin_client):
    """Admin can bulk-update application statuses."""
    create_resp = await client.post("/api/v1/applications", json=SAMPLE_APPLICATION)
    app_id = create_resp.json()["id"]

    resp = await admin_client.post(
        "/api/v1/applications/bulk",
        json={"application_ids": [app_id], "status": "waitlisted"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["updated"] == 1
    assert data["failed"] == 0


@pytest.mark.asyncio
async def test_admin_get_application_by_id(client, seed_user, seed_admin, admin_client):
    """Admin can get any application by ID."""
    create_resp = await client.post("/api/v1/applications", json=SAMPLE_APPLICATION)
    app_id = create_resp.json()["id"]

    resp = await admin_client.get(f"/api/v1/applications/{app_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == app_id
