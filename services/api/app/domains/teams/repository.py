import random
import string
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.teams.models import Team, TeamMember
from app.domains.teams.schemas import TeamCreate
from app.domains.users.models import User


def generate_invite_code(length: int = 6) -> str:
    """Generate a random alphanumeric invite code."""
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


async def create_team(session: AsyncSession, user_id: uuid.UUID, data: TeamCreate) -> Team:
    """Create a new team and add the creator as the 'leader'."""
    # Ensure code uniqueness (simple generation, extremely low collision probability at 6 chars)
    # But could do a loop to check DB in a real robust system.
    invite_code = generate_invite_code()
    
    team = Team(
        created_by=user_id,
        invite_code=invite_code,
        **data.model_dump(),
    )
    session.add(team)
    await session.commit()
    await session.refresh(team)
    
    # Add creator as leader
    leader = TeamMember(team_id=team.id, user_id=user_id, role="leader")
    session.add(leader)
    await session.commit()
    
    # Return loaded team
    return await get_team_by_id(session, team.id)


async def get_team_by_id(session: AsyncSession, team_id: uuid.UUID) -> Team | None:
    query = (
        select(Team)
        .options(selectinload(Team.members).selectinload(TeamMember.user))
        .where(Team.id == team_id)
    )
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def get_team_by_invite_code(session: AsyncSession, code: str) -> Team | None:
    query = (
        select(Team)
        .options(selectinload(Team.members).selectinload(TeamMember.user))
        .where(Team.invite_code == code)
    )
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def get_team_by_user_id(session: AsyncSession, user_id: uuid.UUID) -> Team | None:
    """Find a team that contains the given user ID."""
    query = (
        select(Team)
        .join(TeamMember, Team.id == TeamMember.team_id)
        .options(selectinload(Team.members).selectinload(TeamMember.user))
        .where(TeamMember.user_id == user_id)
    )
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def add_member(session: AsyncSession, team: Team, user_id: uuid.UUID) -> TeamMember:
    """Add a member to a team without committing yet (caller decides)."""
    member = TeamMember(team_id=team.id, user_id=user_id, role="member")
    session.add(member)
    await session.commit()
    return member


async def remove_member(session: AsyncSession, team: Team, user_id: uuid.UUID) -> None:
    """Remove a user from a team. Disband team if empty."""
    query = select(TeamMember).where(TeamMember.team_id == team.id, TeamMember.user_id == user_id)
    result = await session.execute(query)
    member = result.scalar_one_or_none()
    
    if not member:
        return
        
    session.delete(member)
    await session.commit()
    
    # Check if team is empty, or if we need a new leader
    refresh_query = select(Team).options(selectinload(Team.members)).where(Team.id == team.id)
    refresh_result = await session.execute(refresh_query)
    refreshed_team = refresh_result.scalar_one_or_none()
    
    if refreshed_team:
        if len(refreshed_team.members) == 0:
            session.delete(refreshed_team)
            await session.commit()
        else:
            # If the user leaving was the leader, promote first member
            if member.role == "leader":
                next_leader = refreshed_team.members[0]
                next_leader.role = "leader"
                await session.commit()
