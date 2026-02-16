import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


class ApplicationCreate(BaseModel):
    university: str = Field(min_length=1, max_length=200)
    major: str = Field(min_length=1, max_length=200)
    year_of_study: Literal["freshman", "sophomore", "junior", "senior", "grad"]
    graduation_date: date | None = None
    resume_url: str | None = Field(None, max_length=500)  # S3 key
    github_url: HttpUrl | None = None
    linkedin_url: HttpUrl | None = None
    why_attend: str = Field(min_length=50, max_length=1000)
    experience_level: Literal["beginner", "intermediate", "advanced"]
    dietary_restrictions: str | None = Field(None, max_length=500)
    tshirt_size: Literal["XS", "S", "M", "L", "XL", "XXL"]


class ApplicationEdit(BaseModel):
    """Schema for users to edit their own application (all fields optional for partial updates)."""
    university: str | None = Field(None, min_length=1, max_length=200)
    major: str | None = Field(None, min_length=1, max_length=200)
    year_of_study: Literal["freshman", "sophomore", "junior", "senior", "grad"] | None = None
    graduation_date: date | None = None
    resume_url: str | None = Field(None, max_length=500)
    github_url: HttpUrl | None = None
    linkedin_url: HttpUrl | None = None
    why_attend: str | None = Field(None, min_length=50, max_length=1000)
    experience_level: Literal["beginner", "intermediate", "advanced"] | None = None
    dietary_restrictions: str | None = Field(None, max_length=500)
    tshirt_size: Literal["XS", "S", "M", "L", "XL", "XXL"] | None = None


class ApplicationUpdate(BaseModel):
    status: Literal["accepted", "rejected", "waitlisted"]


class BulkStatusUpdate(BaseModel):
    application_ids: list[uuid.UUID]
    status: Literal["accepted", "rejected", "waitlisted"]


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
