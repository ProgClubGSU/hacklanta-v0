from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.users.models import User


async def get_user_by_clerk_id(session: AsyncSession, clerk_id: str) -> User | None:
    result = await session.execute(select(User).where(User.clerk_id == clerk_id))
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
