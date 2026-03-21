import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_supabase_session
from app.core.security import CurrentUser
from app.domains.profiles import repository, schemas

router = APIRouter(tags=["profiles"])


@router.get("/profiles/me", response_model=schemas.ProfileRead)
async def get_my_profile(
    user: CurrentUser, session: Annotated[AsyncSession, Depends(get_supabase_session)]
):
    """Get the current authenticated user's teammate profile."""
    user_id = uuid.UUID(user["sub"])
    profile = await repository.get_profile_by_user_id(session, user_id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )
    return profile


@router.post("/profiles/me", response_model=schemas.ProfileRead)
async def upsert_my_profile(
    data: schemas.ProfileCreate,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_supabase_session)],
):
    """Create or update the current authenticated user's teammate profile."""
    user_id = uuid.UUID(user["sub"])
    profile = await repository.upsert_profile(session, user_id, data)
    return profile


@router.get("/profiles", response_model=list[schemas.ProfileRead])
async def list_profiles(
    user: CurrentUser,  # Auth required to browse directory
    session: Annotated[AsyncSession, Depends(get_supabase_session)],
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    looking_for_team_only: bool = Query(True),
):
    """List teammate profiles for the team matcher directory."""
    # Note: Could exclude the CurrentUser from the results to prevent seeing oneself, 
    # but frontend can filter that easily.
    profiles, _total = await repository.list_profiles(
        session,
        offset=offset,
        limit=limit,
        looking_for_team_only=looking_for_team_only,
    )
    return profiles
