import uuid
from collections.abc import AsyncIterator
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.config import settings

# Primary database (applications, events, food, etc.)
primary_engine = create_async_engine(settings.database_url, echo=False)
primary_session_factory = async_sessionmaker(primary_engine, class_=AsyncSession, expire_on_commit=False)

# Supabase database (team matching: users, teams, profiles)
supabase_engine = create_async_engine(settings.supabase_database_url, echo=False) if settings.supabase_database_url else None
supabase_session_factory = async_sessionmaker(supabase_engine, class_=AsyncSession, expire_on_commit=False) if supabase_engine else None

# Legacy engine (alias for primary for backward compatibility)
engine = primary_engine
async_session_factory = primary_session_factory


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class UUIDMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid()
    )


# Session dependencies
async def get_primary_session() -> AsyncIterator[AsyncSession]:
    """Get session for primary database (applications, events, food, etc.)"""
    async with primary_session_factory() as session:
        yield session

async def get_supabase_session() -> AsyncIterator[AsyncSession]:
    """Get session for Supabase database (team matching: users, teams, profiles)"""
    if not supabase_session_factory:
        raise RuntimeError("Supabase database not configured")
    async with supabase_session_factory() as session:
        yield session

# Keep existing get_session as alias for primary (backward compatibility)
async def get_session() -> AsyncIterator[AsyncSession]:
    async with primary_session_factory() as session:
        yield session
