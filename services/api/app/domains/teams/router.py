import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import CurrentUser
from app.domains.teams import repository, schemas

router = APIRouter(tags=["teams"])


@router.post("/teams", response_model=schemas.TeamRead)
async def create_team(
    data: schemas.TeamCreate,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Create a new team. The creator automatically becomes the leader."""
    user_id = uuid.UUID(user["sub"])
    
    # Check if user is already in a team
    existing_team = await repository.get_team_by_user_id(session, user_id)
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already in a team. Leave it first.",
        )
        
    team = await repository.create_team(session, user_id, data)
    return team


@router.get("/teams/me", response_model=schemas.TeamRead)
async def get_my_team(
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get the current user's team."""
    user_id = uuid.UUID(user["sub"])
    team = await repository.get_team_by_user_id(session, user_id)
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not in a team.",
        )
        
    return team


@router.post("/teams/join", response_model=schemas.TeamRead)
async def join_team(
    data: schemas.JoinTeamRequest,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Join a team using its invite code."""
    user_id = uuid.UUID(user["sub"])
    
    # Check if user is already in a team
    existing_team = await repository.get_team_by_user_id(session, user_id)
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already in a team. Leave it first.",
        )
        
    team = await repository.get_team_by_invite_code(session, data.invite_code)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invite code.",
        )
        
    if len(team.members) >= team.max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This team is full.",
        )
        
    await repository.add_member(session, team, user_id)
    
    # Return fresh team data
    return await repository.get_team_by_id(session, team.id)


@router.post("/teams/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_team(
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Leave the current team."""
    user_id = uuid.UUID(user["sub"])
    
    team = await repository.get_team_by_user_id(session, user_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not in a team.",
        )
        
    await repository.remove_member(session, team, user_id)
