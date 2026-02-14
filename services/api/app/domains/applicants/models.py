import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin, UUIDMixin


class Application(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "applications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String, default="pending")
    university: Mapped[str] = mapped_column(String, nullable=False)
    major: Mapped[str] = mapped_column(String, nullable=False)
    year_of_study: Mapped[str] = mapped_column(String, nullable=False)
    graduation_date: Mapped[date | None] = mapped_column(Date)
    resume_url: Mapped[str | None] = mapped_column(String)
    github_url: Mapped[str | None] = mapped_column(String)
    linkedin_url: Mapped[str | None] = mapped_column(String)
    why_attend: Mapped[str | None] = mapped_column(Text)
    experience_level: Mapped[str | None] = mapped_column(String)
    dietary_restrictions: Mapped[str | None] = mapped_column(String)
    tshirt_size: Mapped[str | None] = mapped_column(String)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user = relationship("User", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
