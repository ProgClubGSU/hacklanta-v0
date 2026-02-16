import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import AdminUser, CurrentUser
from app.domains.applicants import service
from app.domains.applicants.schemas import (
    ApplicationCreate,
    ApplicationEdit,
    ApplicationResponse,
    ApplicationUpdate,
    BulkStatusResponse,
    BulkStatusUpdate,
)
from app.utils.pagination import PaginatedResponse, PaginationParams, paginate

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post(
    "",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_application(
    data: ApplicationCreate,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ApplicationResponse:
    """Submit a new application (authenticated users only)."""
    application = await service.submit_application(
        session, clerk_id=user["sub"], data=data
    )
    return ApplicationResponse.model_validate(application)


@router.post("/upload-url")
async def get_upload_url(
    _user: CurrentUser,
) -> dict:
    """Get a presigned S3 URL for uploading a resume (authenticated users only)."""
    from app.utils.s3 import generate_upload_url

    return generate_upload_url(file_extension=".pdf")


@router.get("/me", response_model=ApplicationResponse)
async def get_my_application(
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ApplicationResponse:
    """Get the current user's application."""
    application = await service.get_my_application(session, clerk_id=user["sub"])
    return ApplicationResponse.model_validate(application)


@router.patch("/me", response_model=ApplicationResponse)
async def edit_my_application(
    data: ApplicationEdit,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ApplicationResponse:
    """Edit the current user's application (only if pending or waitlisted)."""
    application = await service.edit_my_application(
        session, clerk_id=user["sub"], data=data
    )
    return ApplicationResponse.model_validate(application)


@router.get(
    "/{application_id}",
    response_model=ApplicationResponse,
)
async def get_application(
    application_id: uuid.UUID,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ApplicationResponse:
    """Get an application by ID (admin only)."""
    application = await service.get_application(session, application_id)
    return ApplicationResponse.model_validate(application)


@router.get("", response_model=PaginatedResponse[ApplicationResponse])
async def list_applications(
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    status_filter: Annotated[str | None, Query(alias="status")] = None,
    experience: Annotated[str | None, Query()] = None,
) -> PaginatedResponse[ApplicationResponse]:
    """List all applications with pagination and filters (admin only)."""
    params = PaginationParams(page=page, page_size=page_size)
    from app.domains.applicants.repository import list_applications as list_apps

    applications, total = await list_apps(
        session,
        offset=params.offset,
        limit=params.limit,
        status_filter=status_filter,
        experience_filter=experience,
    )
    items = [ApplicationResponse.model_validate(app) for app in applications]
    return paginate(items, total, params)


@router.post(
    "/bulk",
    response_model=BulkStatusResponse,
)
async def bulk_update_applications(
    data: BulkStatusUpdate,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> BulkStatusResponse:
    """Bulk update application statuses — accept, reject, or waitlist (admin only)."""
    result = await service.bulk_review_applications(
        session,
        application_ids=data.application_ids,
        new_status=data.status,
        reviewer_clerk_id=admin["sub"],
    )
    return BulkStatusResponse(**result)


@router.patch(
    "/{application_id}",
    response_model=ApplicationResponse,
)
async def update_application_status(
    application_id: uuid.UUID,
    data: ApplicationUpdate,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ApplicationResponse:
    """Update an application's status — accept, reject, or waitlist (admin only)."""
    application = await service.review_application(
        session,
        application_id=application_id,
        new_status=data.status,
        reviewer_clerk_id=admin["sub"],
    )
    return ApplicationResponse.model_validate(application)
