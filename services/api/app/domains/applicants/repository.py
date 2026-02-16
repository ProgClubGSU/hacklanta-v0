import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.applicants.models import Application


async def create_application(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    data: dict,
) -> Application:
    application = Application(user_id=user_id, **data)
    session.add(application)
    await session.commit()
    await session.refresh(application)
    return application


async def get_application_by_id(
    session: AsyncSession, application_id: uuid.UUID
) -> Application | None:
    result = await session.execute(
        select(Application).where(Application.id == application_id)
    )
    return result.scalar_one_or_none()


async def get_application_by_user_id(
    session: AsyncSession, user_id: uuid.UUID
) -> Application | None:
    result = await session.execute(
        select(Application).where(Application.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def list_applications(
    session: AsyncSession,
    *,
    offset: int = 0,
    limit: int = 20,
    status_filter: str | None = None,
    experience_filter: str | None = None,
) -> tuple[list[Application], int]:
    query = select(Application)
    count_query = select(func.count()).select_from(Application)

    if status_filter:
        query = query.where(Application.status == status_filter)
        count_query = count_query.where(Application.status == status_filter)

    if experience_filter:
        query = query.where(Application.experience_level == experience_filter)
        count_query = count_query.where(Application.experience_level == experience_filter)

    total_result = await session.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(Application.created_at.desc()).offset(offset).limit(limit)
    result = await session.execute(query)
    applications = list(result.scalars().all())

    return applications, total


async def update_application_status(
    session: AsyncSession,
    application: Application,
    *,
    status: str,
    reviewed_by: uuid.UUID,
) -> Application:
    application.status = status
    application.reviewed_by = reviewed_by
    application.reviewed_at = func.now()
    await session.commit()
    await session.refresh(application)
    return application
