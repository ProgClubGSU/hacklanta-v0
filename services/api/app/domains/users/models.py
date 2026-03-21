from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin, UUIDMixin


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    clerk_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    first_name: Mapped[str | None] = mapped_column(String)
    last_name: Mapped[str | None] = mapped_column(String)
    avatar_url: Mapped[str | None] = mapped_column(String)
    role: Mapped[str] = mapped_column(String, default="user")
    
    # Track when the acceptance email was sent to prevent double-sends
    acceptance_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    profile = relationship("Profile", back_populates="user", uselist=False)
