import asyncio
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import AdminUser, CurrentUser
from app.domains.announcements import service
from app.domains.announcements.schemas import AnnouncementCreate, AnnouncementResponse

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("", response_model=list[AnnouncementResponse])
async def list_announcements(
    _user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[AnnouncementResponse]:
    """Get recent announcements."""
    announcements = await service.list_announcements(session)
    return [AnnouncementResponse.model_validate(a) for a in announcements]


@router.post(
    "",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_announcement(
    data: AnnouncementCreate,
    admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AnnouncementResponse:
    """Create a new announcement (admin only)."""
    announcement = await service.create_announcement(
        session, clerk_id=admin["sub"], data=data
    )
    return AnnouncementResponse.model_validate(announcement)


@router.get("/stream")
async def stream_announcements() -> StreamingResponse:
    """SSE endpoint for real-time announcements. Clients connect via EventSource."""

    async def event_generator() -> AsyncGenerator[str, None]:
        # Send initial keepalive
        yield ": connected\n\n"

        while True:
            # Poll for new announcements every 5 seconds
            # In production, this would use Redis pub/sub or similar
            await asyncio.sleep(5)
            yield ": keepalive\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
