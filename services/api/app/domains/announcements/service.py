from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.announcements import repository
from app.domains.announcements.models import Announcement
from app.domains.announcements.schemas import AnnouncementCreate
from app.domains.applicants.service import resolve_user_id


async def create_announcement(
    session: AsyncSession,
    *,
    clerk_id: str,
    data: AnnouncementCreate,
) -> Announcement:
    user_id = await resolve_user_id(session, clerk_id)
    return await repository.create_announcement(
        session,
        title=data.title,
        body=data.body,
        priority=data.priority,
        created_by=user_id,
    )


async def list_announcements(session: AsyncSession) -> list[Announcement]:
    return await repository.list_announcements(session)
