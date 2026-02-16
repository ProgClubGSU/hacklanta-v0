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
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "desc",
) -> tuple[list[Application], int]:
    query = select(Application)
    count_query = select(func.count()).select_from(Application)

    # Status filter
    if status_filter:
        query = query.where(Application.status == status_filter)
        count_query = count_query.where(Application.status == status_filter)

    # Experience filter
    if experience_filter:
        query = query.where(Application.experience_level == experience_filter)
        count_query = count_query.where(Application.experience_level == experience_filter)

    # Search across multiple fields
    if search:
        search_term = f"%{search}%"
        search_condition = (
            Application.university.ilike(search_term)
            | Application.major.ilike(search_term)
            | Application.email.ilike(search_term)
            | Application.phone_number.ilike(search_term)
        )
        query = query.where(search_condition)
        count_query = count_query.where(search_condition)

    # Get total count
    total_result = await session.execute(count_query)
    total = total_result.scalar_one()

    # Sorting
    sort_column = {
        "created_at": Application.created_at,
        "university": Application.university,
        "major": Application.major,
        "status": Application.status,
        "year_of_study": Application.year_of_study,
        "experience_level": Application.experience_level,
    }.get(sort_by, Application.created_at)

    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    # Pagination
    query = query.offset(offset).limit(limit)
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


async def update_application_data(
    session: AsyncSession,
    application: Application,
    *,
    data: dict,
) -> Application:
    """Update application fields (user-editable fields only)."""
    for key, value in data.items():
        if value is not None:  # Only update provided fields
            setattr(application, key, value)
    await session.commit()
    await session.refresh(application)
    return application
