import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.events import repository
from app.domains.events.models import Event
from app.domains.events.schemas import EventCreate, EventUpdate


async def create_event(session: AsyncSession, *, data: EventCreate) -> Event:
    return await repository.create_event(session, data=data.model_dump())


async def get_event(session: AsyncSession, event_id: uuid.UUID) -> Event:
    event = await repository.get_event_by_id(session, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    return event


async def list_events(session: AsyncSession) -> list[Event]:
    return await repository.list_events(session)


async def update_event(session: AsyncSession, *, event_id: uuid.UUID, data: EventUpdate) -> Event:
    event = await get_event(session, event_id)
    update_data = data.model_dump(exclude_unset=True)
    return await repository.update_event(session, event, data=update_data)


async def delete_event(session: AsyncSession, event_id: uuid.UUID) -> None:
    event = await get_event(session, event_id)
    await repository.delete_event(session, event)
