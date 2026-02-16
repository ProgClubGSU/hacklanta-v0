import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.events.models import Event


async def create_event(session: AsyncSession, *, data: dict) -> Event:
    event = Event(**data)
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event


async def get_event_by_id(session: AsyncSession, event_id: uuid.UUID) -> Event | None:
    result = await session.execute(select(Event).where(Event.id == event_id))
    return result.scalar_one_or_none()


async def list_events(session: AsyncSession) -> list[Event]:
    result = await session.execute(select(Event).order_by(Event.starts_at.asc()))
    return list(result.scalars().all())


async def update_event(session: AsyncSession, event: Event, *, data: dict) -> Event:
    for key, value in data.items():
        if value is not None:
            setattr(event, key, value)
    await session.commit()
    await session.refresh(event)
    return event


async def delete_event(session: AsyncSession, event: Event) -> None:
    await session.delete(event)
    await session.commit()
