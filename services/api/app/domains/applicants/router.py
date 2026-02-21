from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import CurrentUser, clerk_client
from app.domains.applicants.repository import (
    get_application_by_email,
    get_application_by_user_id,
    link_application_to_user,
)
from app.domains.applicants.schemas import ApplicationStatusResponse
from app.domains.users.repository import get_user_by_clerk_id, upsert_user

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("/me", response_model=ApplicationStatusResponse)
async def get_my_application(
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    clerk_id = user["sub"]

    # Look up local DB user
    db_user = await get_user_by_clerk_id(session, clerk_id)

    # Auto-sync from Clerk if webhook hasn't fired yet
    if db_user is None:
        clerk_user = clerk_client.users.get(user_id=clerk_id)
        email = next(
            (
                ea.email_address
                for ea in (clerk_user.email_addresses or [])
                if ea.id == clerk_user.primary_email_address_id
            ),
            None,
        )
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No email associated with your account",
            )
        db_user = await upsert_user(
            session,
            clerk_id=clerk_id,
            email=email,
            first_name=clerk_user.first_name,
            last_name=clerk_user.last_name,
            avatar_url=clerk_user.image_url,
        )

    # Try by user_id first
    application = await get_application_by_user_id(session, db_user.id)

    # Fallback: match by email (Tally submitted before Clerk signup)
    if application is None and db_user.email:
        application = await get_application_by_email(session, db_user.email)
        if application is not None:
            application = await link_application_to_user(
                session, application, db_user.id
            )

    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No application found",
        )

    return application
