import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.announcements.models import Announcement


async def create_announcement(
    session: AsyncSession,
    *,
    title: str,
    body: str,
    priority: str,
    created_by: uuid.UUID,
) -> Announcement:
    announcement = Announcement(title=title, body=body, priority=priority, created_by=created_by)
    session.add(announcement)
    await session.commit()
    await session.refresh(announcement)
    return announcement


async def list_announcements(session: AsyncSession, *, limit: int = 50) -> list[Announcement]:
    result = await session.execute(
        select(Announcement).order_by(Announcement.created_at.desc()).limit(limit)
    )
    return list(result.scalars().all())
