import uuid
from datetime import date, datetime

from pydantic import BaseModel, HttpUrl


class ApplicationCreate(BaseModel):
    university: str
    major: str
    year_of_study: str
    graduation_date: date | None = None
    resume_url: str | None = None
    github_url: HttpUrl | None = None
    linkedin_url: HttpUrl | None = None
    why_attend: str | None = None
    experience_level: str | None = None  # 'beginner' | 'intermediate' | 'advanced'
    dietary_restrictions: str | None = None
    tshirt_size: str | None = None


class ApplicationUpdate(BaseModel):
    status: str  # 'accepted' | 'rejected' | 'waitlisted'


class BulkStatusUpdate(BaseModel):
    application_ids: list[uuid.UUID]
    status: str  # 'accepted' | 'rejected' | 'waitlisted'


class BulkStatusResponse(BaseModel):
    updated: int
    failed: int
    total: int


class ApplicationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    university: str
    major: str
    year_of_study: str
    graduation_date: date | None
    resume_url: str | None
    github_url: str | None
    linkedin_url: str | None
    why_attend: str | None
    experience_level: str | None
    dietary_restrictions: str | None
    tshirt_size: str | None
    reviewed_by: uuid.UUID | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
