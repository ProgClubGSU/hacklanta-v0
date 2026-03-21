import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_supabase_session
from app.core.security import CurrentUser
from app.domains.teams import repository, schemas

router = APIRouter(tags=["teams"])


@router.post("/teams", response_model=schemas.TeamRead)
async def create_team(
    data: schemas.TeamCreate,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_supabase_session)],
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
    session: Annotated[AsyncSession, Depends(get_supabase_session)],
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
    session: Annotated[AsyncSession, Depends(get_supabase_session)],
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
    session: Annotated[AsyncSession, Depends(get_supabase_session)],
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


# Team Browsing Endpoints
@router.get("/teams")
async def list_teams(
    offset: int = 0,
    limit: int = 50,
    has_openings: bool | None = None,
    user: CurrentUser = None,
    session: Annotated[AsyncSession, Depends(get_supabase_session)] = None,
):
    """List all teams with pagination and optional filtering."""
    if limit > 100:
        limit = 100

    teams, total = await repository.list_teams(session, offset, limit, has_openings)

    return {
        "data": teams,
        "meta": {
            "total": total,
            "offset": offset,
            "limit": limit,
        },
    }


@router.get("/teams/{team_id}", response_model=schemas.TeamDetailRead)
async def get_team_by_id(
    team_id: uuid.UUID,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_supabase_session)],
):
    """Get team details by ID, including current user's join request status if any."""
    user_id = uuid.UUID(user["sub"])

    team, join_request_status, join_request_id = await repository.get_team_with_details(
        session, team_id, user_id
    )

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found.",
        )

    # Build response
    team_dict = {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "invite_code": team.invite_code,
        "max_size": team.max_size,
        "is_looking_for_members": team.is_looking_for_members,
        "created_by": team.created_by,
        "members": [
            {
                "id": member.id,
                "user_id": member.user_id,
                "role": member.role,
                "first_name": member.user.first_name if member.user else None,
                "last_name": member.user.last_name if member.user else None,
                "avatar_url": member.user.avatar_url if member.user else None,
                "email": member.user.email if member.user else None,
            }
            for member in team.members
        ],
        "join_request_status": join_request_status,
        "join_request_id": join_request_id,
    }

    return team_dict


# Join Request Endpoints
@router.post("/teams/{team_id}/join-requests", response_model=schemas.JoinRequestRead)
async def create_join_request(
    team_id: uuid.UUID,
    data: schemas.JoinRequestCreate,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_supabase_session)],
):
    """Submit a join request to a team."""
    user_id = uuid.UUID(user["sub"])

    try:
        join_request = await repository.create_join_request(
            session, team_id, user_id, data.message
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # Build response with user info
    return {
        "id": join_request.id,
        "team_id": join_request.team_id,
        "user_id": join_request.user_id,
        "status": join_request.status,
        "message": join_request.message,
        "expires_at": join_request.expires_at,
        "created_at": join_request.created_at,
    }


@router.get("/teams/{team_id}/join-requests")
async def list_team_join_requests(
    team_id: uuid.UUID,
    status_filter: str = "pending",
    user: CurrentUser = None,
    session: Annotated[AsyncSession, Depends(get_supabase_session)] = None,
):
    """List join requests for a team (leaders only)."""
    user_id = uuid.UUID(user["sub"])

    # Verify user is a leader of this team
    team = await repository.get_team_by_id(session, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found.",
        )

    # Check if user is a leader
    is_leader = any(
        member.user_id == user_id and member.role == "leader"
        for member in team.members
    )

    if not is_leader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team leaders can view join requests.",
        )

    requests = await repository.list_join_requests_for_team(session, team_id, status_filter)

    # Build response
    return {
        "data": [
            {
                "id": req.id,
                "team_id": req.team_id,
                "user_id": req.user_id,
                "status": req.status,
                "message": req.message,
                "expires_at": req.expires_at,
                "created_at": req.created_at,
                "user_first_name": req.user.first_name if req.user else None,
                "user_last_name": req.user.last_name if req.user else None,
                "user_avatar_url": req.user.avatar_url if req.user else None,
                "user_email": req.user.email if req.user else None,
            }
            for req in requests
        ]
    }


@router.patch("/teams/{team_id}/join-requests/{request_id}", response_model=schemas.JoinRequestRead)
async def update_join_request(
    team_id: uuid.UUID,
    request_id: uuid.UUID,
    data: schemas.JoinRequestUpdate,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_supabase_session)],
):
    """Approve or reject a join request (leaders only)."""
    user_id = uuid.UUID(user["sub"])

    # Verify user is a leader of this team
    team = await repository.get_team_by_id(session, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found.",
        )

    is_leader = any(
        member.user_id == user_id and member.role == "leader"
        for member in team.members
    )

    if not is_leader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team leaders can approve/reject join requests.",
        )

    try:
        updated_request = await repository.update_join_request_status(
            session, request_id, data.status, user_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return {
        "id": updated_request.id,
        "team_id": updated_request.team_id,
        "user_id": updated_request.user_id,
        "status": updated_request.status,
        "message": updated_request.message,
        "expires_at": updated_request.expires_at,
        "created_at": updated_request.created_at,
    }


@router.delete("/teams/join-requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def withdraw_join_request(
    request_id: uuid.UUID,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_supabase_session)],
):
    """Withdraw a join request (by the user who created it)."""
    user_id = uuid.UUID(user["sub"])

    try:
        await repository.withdraw_join_request(session, request_id, user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
