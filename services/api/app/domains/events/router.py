import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import AdminUser, CurrentUser
from app.domains.events import service
from app.domains.events.schemas import EventCreate, EventResponse, EventUpdate

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventResponse])
async def list_events(
    _user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[EventResponse]:
    """Get the full event schedule, ordered by start time."""
    events = await service.list_events(session)
    return [EventResponse.model_validate(e) for e in events]


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: uuid.UUID,
    _user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> EventResponse:
    """Get a specific event by ID."""
    event = await service.get_event(session, event_id)
    return EventResponse.model_validate(event)


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event(
    data: EventCreate,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> EventResponse:
    """Create a new event (admin only)."""
    event = await service.create_event(session, data=data)
    return EventResponse.model_validate(event)


@router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: uuid.UUID,
    data: EventUpdate,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> EventResponse:
    """Update an event (admin only)."""
    event = await service.update_event(session, event_id=event_id, data=data)
    return EventResponse.model_validate(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: uuid.UUID,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> None:
    """Delete an event (admin only)."""
    await service.delete_event(session, event_id)
