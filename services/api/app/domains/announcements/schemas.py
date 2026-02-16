import uuid
from datetime import datetime

from pydantic import BaseModel


class AnnouncementCreate(BaseModel):
    title: str
    body: str
    priority: str = "normal"  # 'low' | 'normal' | 'urgent'


class AnnouncementResponse(BaseModel):
    id: uuid.UUID
    title: str
    body: str
    priority: str
    created_by: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
