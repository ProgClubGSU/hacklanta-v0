import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.profiles.models import Profile
from app.domains.profiles.schemas import ProfileCreate, ProfileUpdate


async def get_profile_by_user_id(session: AsyncSession, user_id: uuid.UUID) -> Profile | None:
    result = await session.execute(select(Profile).where(Profile.user_id == user_id))
    return result.scalar_one_or_none()


async def list_profiles(
    session: AsyncSession, *, offset: int = 0, limit: int = 50, looking_for_team_only: bool = True
) -> tuple[list[Profile], int]:
    query = select(Profile)
    if looking_for_team_only:
        query = query.where(Profile.looking_for_team == True)
        
    # We could fetch totals if needed, keeping it simple
    query = query.offset(offset).limit(limit)
    result = await session.execute(query)
    profiles = list(result.scalars().all())
    
    return profiles, len(profiles)


async def upsert_profile(
    session: AsyncSession, user_id: uuid.UUID, data: ProfileCreate | ProfileUpdate
) -> Profile:
    profile = await get_profile_by_user_id(session, user_id)
    
    if profile:
        for key, value in data.model_dump().items():
            setattr(profile, key, value)
    else:
        profile = Profile(user_id=user_id, **data.model_dump())
        session.add(profile)
        
    await session.commit()
    await session.refresh(profile)
    return profile
