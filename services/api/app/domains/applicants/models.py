import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin, UUIDMixin


class Application(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "applications"

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    status: Mapped[str] = mapped_column(String, default="pending")

    # Tally webhook tracking (null for API-submitted applications)
    tally_response_id: Mapped[str | None] = mapped_column(String, unique=True)

    # Academic Info
    university: Mapped[str] = mapped_column(String, nullable=False)
    major: Mapped[str] = mapped_column(String, nullable=False)
    year_of_study: Mapped[str] = mapped_column(String, nullable=False)
    graduation_date: Mapped[date | None] = mapped_column(Date)

    # Contact Info (nullable to support existing records, but required via Pydantic)
    phone_number: Mapped[str | None] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String)

    # Links
    resume_url: Mapped[str | None] = mapped_column(String)
    github_url: Mapped[str | None] = mapped_column(String)
    linkedin_url: Mapped[str | None] = mapped_column(String)

    # About
    why_attend: Mapped[str | None] = mapped_column(Text)
    experience_level: Mapped[str | None] = mapped_column(String)

    # Logistics
    dietary_restrictions: Mapped[str | None] = mapped_column(String)
    tshirt_size: Mapped[str | None] = mapped_column(String)

    # Legal & Agreements (required)
    age_confirmed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    code_of_conduct_accepted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    liability_waiver_accepted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Marketing
    how_did_you_hear: Mapped[str | None] = mapped_column(String)
    resume_sharing_opt_in: Mapped[bool] = mapped_column(Boolean, default=False)
    email_opt_in: Mapped[bool] = mapped_column(Boolean, default=False)
    sms_opt_in: Mapped[bool] = mapped_column(Boolean, default=False)

    # Review tracking
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user = relationship("User", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
