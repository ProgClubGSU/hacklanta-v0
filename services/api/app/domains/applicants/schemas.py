import uuid
from datetime import datetime

from pydantic import BaseModel


class ApplicationStatusResponse(BaseModel):
    id: uuid.UUID
    status: str
    university: str
    major: str
    year_of_study: str
    experience_level: str | None
    created_at: datetime
    reviewed_at: datetime | None

    model_config = {"from_attributes": True}
