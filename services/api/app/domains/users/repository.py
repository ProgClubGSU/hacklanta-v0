import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.users.models import User


async def get_user_by_id(session: AsyncSession, user_id: uuid.UUID) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_clerk_id(session: AsyncSession, clerk_id: str) -> User | None:
    result = await session.execute(select(User).where(User.clerk_id == clerk_id))
    return result.scalar_one_or_none()


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def upsert_user(
    session: AsyncSession,
    *,
    clerk_id: str,
    email: str,
    first_name: str | None = None,
    last_name: str | None = None,
    avatar_url: str | None = None,
) -> User:
    user = await get_user_by_clerk_id(session, clerk_id)

    if user is None:
        user = User(
            clerk_id=clerk_id,
            email=email,
            first_name=first_name,
            last_name=last_name,
            avatar_url=avatar_url,
        )
        session.add(user)
    else:
        user.email = email
        user.first_name = first_name
        user.last_name = last_name
        user.avatar_url = avatar_url

    await session.commit()
    await session.refresh(user)
    return user


async def list_users(
    session: AsyncSession,
    offset: int = 0,
    limit: int = 50,
) -> tuple[list[User], int]:
    """List all users with pagination."""
    # Get total count
    count_query = select(func.count()).select_from(User)
    total_result = await session.execute(count_query)
    total = total_result.scalar_one()

    # Get users with pagination
    query = (
        select(User)
        .order_by(User.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    result = await session.execute(query)
    users = list(result.scalars().all())

    return users, total
