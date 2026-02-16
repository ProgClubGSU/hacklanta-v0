import uuid
from datetime import datetime

from pydantic import BaseModel


class EventCreate(BaseModel):
    title: str
    description: str | None = None
    event_type: str  # 'workshop' | 'minigame' | 'ceremony' | 'meal' | 'general'
    location: str | None = None
    starts_at: datetime
    ends_at: datetime
    capacity: int | None = None


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    event_type: str | None = None
    location: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    capacity: int | None = None


class EventResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    event_type: str
    location: str | None
    starts_at: datetime
    ends_at: datetime
    capacity: int | None
    created_at: datetime

    model_config = {"from_attributes": True}
