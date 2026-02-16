import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.applicants.service import resolve_user_id
from app.domains.contestants import repository
from app.domains.contestants.models import Team
from app.domains.contestants.schemas import TeamCreate


async def create_team(
    session: AsyncSession,
    *,
    clerk_id: str,
    data: TeamCreate,
) -> Team:
    user_id = await resolve_user_id(session, clerk_id)

    # Check if user is already on a team
    existing = await repository.get_user_team(session, user_id)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already on a team.",
        )

    return await repository.create_team(
        session,
        name=data.name,
        description=data.description,
        max_size=data.max_size,
        created_by=user_id,
    )


async def join_team(
    session: AsyncSession,
    *,
    clerk_id: str,
    invite_code: str,
) -> Team:
    user_id = await resolve_user_id(session, clerk_id)

    # Check if user is already on a team
    existing = await repository.get_user_team(session, user_id)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already on a team.",
        )

    team = await repository.get_team_by_invite_code(session, invite_code)
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invite code.",
        )

    if len(team.members) >= team.max_size:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Team is full.",
        )

    await repository.add_member(session, team_id=team.id, user_id=user_id)

    # Refresh to include the new member
    refreshed = await repository.get_team_by_id(session, team.id)
    if refreshed is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return refreshed


async def get_my_team(
    session: AsyncSession,
    *,
    clerk_id: str,
) -> Team:
    user_id = await resolve_user_id(session, clerk_id)

    team = await repository.get_user_team(session, user_id)
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not on a team.",
        )
    return team


async def leave_team(
    session: AsyncSession,
    *,
    clerk_id: str,
    team_id: uuid.UUID,
) -> None:
    user_id = await resolve_user_id(session, clerk_id)

    removed = await repository.remove_member(session, team_id=team_id, user_id=user_id)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not a member of this team.",
        )
