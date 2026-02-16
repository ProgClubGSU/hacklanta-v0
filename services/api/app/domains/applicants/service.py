import logging
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.applicants import repository
from app.domains.applicants.models import Application
from app.domains.applicants.schemas import ApplicationCreate
from app.domains.users.repository import get_user_by_clerk_id, get_user_by_id

logger = logging.getLogger(__name__)

# Map application status to email template name
STATUS_EMAIL_TEMPLATES = {
    "accepted": "application_accepted",
    "rejected": "application_rejected",
    "waitlisted": "application_waitlisted",
}


async def resolve_user_id(session: AsyncSession, clerk_id: str) -> uuid.UUID:
    """Look up the internal user ID from a Clerk ID."""
    user = await get_user_by_clerk_id(session, clerk_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Ensure your account has been synced.",
        )
    return user.id


async def submit_application(
    session: AsyncSession,
    *,
    clerk_id: str,
    data: ApplicationCreate,
) -> Application:
    user_id = await resolve_user_id(session, clerk_id)

    existing = await repository.get_application_by_user_id(session, user_id)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already submitted an application.",
        )

    # Convert HttpUrl fields to strings for the ORM
    app_data = data.model_dump()
    for url_field in ("github_url", "linkedin_url"):
        if app_data.get(url_field) is not None:
            app_data[url_field] = str(app_data[url_field])

    application = await repository.create_application(session, user_id=user_id, data=app_data)

    # Fire confirmation email
    user = await get_user_by_id(session, user_id)
    if user:
        _send_status_email(user.email, user.first_name or "Hacker", "application_received")

    return application


async def get_my_application(
    session: AsyncSession,
    *,
    clerk_id: str,
) -> Application:
    user_id = await resolve_user_id(session, clerk_id)

    application = await repository.get_application_by_user_id(session, user_id)
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No application found.",
        )
    return application


async def get_application(
    session: AsyncSession,
    application_id: uuid.UUID,
) -> Application:
    application = await repository.get_application_by_id(session, application_id)
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )
    return application


async def review_application(
    session: AsyncSession,
    *,
    application_id: uuid.UUID,
    new_status: str,
    reviewer_clerk_id: str,
) -> Application:
    valid_statuses = {"accepted", "rejected", "waitlisted"}
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Status must be one of: {', '.join(valid_statuses)}",
        )

    application = await get_application(session, application_id)
    reviewer_id = await resolve_user_id(session, reviewer_clerk_id)

    updated = await repository.update_application_status(
        session,
        application,
        status=new_status,
        reviewed_by=reviewer_id,
    )

    # Fire status change email
    template = STATUS_EMAIL_TEMPLATES.get(new_status)
    if template:
        user = await get_user_by_id(session, updated.user_id)
        if user:
            _send_status_email(user.email, user.first_name or "Hacker", template)

    return updated


async def bulk_review_applications(
    session: AsyncSession,
    *,
    application_ids: list[uuid.UUID],
    new_status: str,
    reviewer_clerk_id: str,
) -> dict:
    """Bulk update application statuses and queue emails."""
    valid_statuses = {"accepted", "rejected", "waitlisted"}
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Status must be one of: {', '.join(valid_statuses)}",
        )

    reviewer_id = await resolve_user_id(session, reviewer_clerk_id)
    updated = 0
    failed = 0

    for app_id in application_ids:
        try:
            application = await repository.get_application_by_id(session, app_id)
            if application is None:
                failed += 1
                continue

            await repository.update_application_status(
                session, application, status=new_status, reviewed_by=reviewer_id
            )

            template = STATUS_EMAIL_TEMPLATES.get(new_status)
            if template:
                user = await get_user_by_id(session, application.user_id)
                if user:
                    _send_status_email(user.email, user.first_name or "Hacker", template)

            updated += 1
        except Exception:
            logger.exception("Failed to update application %s", app_id)
            failed += 1

    return {"updated": updated, "failed": failed, "total": len(application_ids)}


def _send_status_email(email: str, name: str, template_name: str) -> None:
    """Queue a status email via Celery. Fails silently — email is best-effort."""
    try:
        from app.workers.email_tasks import send_status_email

        send_status_email.delay(to=email, name=name, template_name=template_name)
    except Exception:
        logger.exception("Failed to queue %s email to %s", template_name, email)
