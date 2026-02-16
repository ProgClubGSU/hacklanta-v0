import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


class ApplicationCreate(BaseModel):
    # Academic Info
    university: str = Field(min_length=1, max_length=200)
    major: str = Field(min_length=1, max_length=200)
    year_of_study: Literal["freshman", "sophomore", "junior", "senior", "grad"]
    graduation_date: date | None = None

    # Contact Info
    phone_number: str = Field(min_length=1, max_length=20)
    email: str = Field(min_length=1, max_length=255)

    # Links
    resume_url: str | None = Field(None, max_length=500)  # S3 key
    github_url: HttpUrl | None = None
    linkedin_url: HttpUrl | None = None

    # About
    why_attend: str = Field(min_length=50, max_length=1000)
    experience_level: Literal["beginner", "intermediate", "advanced"]

    # Logistics
    dietary_restrictions: str | None = Field(None, max_length=500)
    tshirt_size: Literal["XS", "S", "M", "L", "XL", "XXL"]

    # Legal & Agreements (required)
    age_confirmed: bool = Field(default=False, description="Must be 18 or older")
    code_of_conduct_accepted: bool = Field(default=False, description="Acceptance of code of conduct")
    liability_waiver_accepted: bool = Field(default=False, description="Acceptance of liability waiver")

    # Marketing
    how_did_you_hear: str | None = Field(None, max_length=200)
    resume_sharing_opt_in: bool = Field(default=False, description="Opt-in to share resume with sponsors")
    email_opt_in: bool = Field(default=False, description="Opt-in to receive emails")
    sms_opt_in: bool = Field(default=False, description="Opt-in to receive SMS messages")


class ApplicationEdit(BaseModel):
    """Schema for users to edit their own application (all fields optional for partial updates)."""
    # Academic Info
    university: str | None = Field(None, min_length=1, max_length=200)
    major: str | None = Field(None, min_length=1, max_length=200)
    year_of_study: Literal["freshman", "sophomore", "junior", "senior", "grad"] | None = None
    graduation_date: date | None = None

    # Contact Info
    phone_number: str | None = Field(None, min_length=1, max_length=20)
    email: str | None = Field(None, min_length=1, max_length=255)

    # Links
    resume_url: str | None = Field(None, max_length=500)
    github_url: HttpUrl | None = None
    linkedin_url: HttpUrl | None = None

    # About
    why_attend: str | None = Field(None, min_length=50, max_length=1000)
    experience_level: Literal["beginner", "intermediate", "advanced"] | None = None

    # Logistics
    dietary_restrictions: str | None = Field(None, max_length=500)
    tshirt_size: Literal["XS", "S", "M", "L", "XL", "XXL"] | None = None

    # Legal & Agreements (cannot be edited - set once during initial submission)
    # Marketing (allow users to update their marketing preferences)
    how_did_you_hear: str | None = Field(None, max_length=200)
    resume_sharing_opt_in: bool | None = None
    email_opt_in: bool | None = None
    sms_opt_in: bool | None = None


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

    # Academic Info
    university: str
    major: str
    year_of_study: str
    graduation_date: date | None

    # Contact Info
    phone_number: str | None
    email: str | None

    # Links
    resume_url: str | None
    github_url: str | None
    linkedin_url: str | None

    # About
    why_attend: str | None
    experience_level: str | None

    # Logistics
    dietary_restrictions: str | None
    tshirt_size: str | None

    # Legal & Agreements
    age_confirmed: bool
    code_of_conduct_accepted: bool
    liability_waiver_accepted: bool

    # Marketing
    how_did_you_hear: str | None
    resume_sharing_opt_in: bool
    email_opt_in: bool
    sms_opt_in: bool

    # Review tracking
    reviewed_by: uuid.UUID | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
