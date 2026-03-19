import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin, UUIDMixin


class Profile(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    bio: Mapped[str | None] = mapped_column(Text)
    linkedin_url: Mapped[str | None] = mapped_column(String)
    github_url: Mapped[str | None] = mapped_column(String)
    portfolio_url: Mapped[str | None] = mapped_column(String)
    looking_for_team: Mapped[bool] = mapped_column(Boolean, default=True)

    user = relationship("User", back_populates="profile")
