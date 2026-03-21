import random
import string
import uuid
from datetime import datetime, timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.teams.models import Team, TeamJoinRequest, TeamMember
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


# Team List/Browse Functions
async def list_teams(
    session: AsyncSession,
    offset: int = 0,
    limit: int = 50,
    has_openings: bool | None = None
) -> tuple[list[dict], int]:
    """List all teams with member count. Optionally filter by availability."""
    # Build base query with member count
    member_count_subquery = (
        select(
            TeamMember.team_id,
            func.count(TeamMember.id).label("member_count")
        )
        .group_by(TeamMember.team_id)
        .subquery()
    )

    query = (
        select(
            Team,
            func.coalesce(member_count_subquery.c.member_count, 0).label("member_count")
        )
        .outerjoin(member_count_subquery, Team.id == member_count_subquery.c.team_id)
    )

    # Apply filters
    if has_openings is not None:
        if has_openings:
            # Only teams with fewer members than max_size
            query = query.where(
                func.coalesce(member_count_subquery.c.member_count, 0) < Team.max_size
            )
        else:
            # Only full teams
            query = query.where(
                func.coalesce(member_count_subquery.c.member_count, 0) >= Team.max_size
            )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar_one()

    # Apply pagination and order
    query = query.order_by(Team.created_at.desc()).offset(offset).limit(limit)

    result = await session.execute(query)
    rows = result.all()

    # Build response
    teams = []
    for row in rows:
        team = row[0]
        member_count = row[1]
        teams.append({
            "id": team.id,
            "name": team.name,
            "description": team.description,
            "member_count": member_count,
            "max_size": team.max_size,
            "is_full": member_count >= team.max_size,
            "is_looking_for_members": team.is_looking_for_members,
            "created_at": team.created_at
        })

    return teams, total


async def get_team_with_details(
    session: AsyncSession,
    team_id: uuid.UUID,
    current_user_id: uuid.UUID | None = None
) -> tuple[Team | None, str | None, uuid.UUID | None]:
    """Get team with members + current user's join request status if any."""
    team = await get_team_by_id(session, team_id)

    if not team or not current_user_id:
        return team, None, None

    # Check for existing join request
    request_query = (
        select(TeamJoinRequest)
        .where(
            TeamJoinRequest.team_id == team_id,
            TeamJoinRequest.user_id == current_user_id,
            TeamJoinRequest.status == "pending"
        )
    )
    request_result = await session.execute(request_query)
    join_request = request_result.scalar_one_or_none()

    if join_request:
        return team, join_request.status, join_request.id

    return team, None, None


# Join Request Functions
async def get_join_request_count_for_user(session: AsyncSession, user_id: uuid.UUID) -> int:
    """Count pending join requests for a user."""
    query = select(func.count()).select_from(TeamJoinRequest).where(
        TeamJoinRequest.user_id == user_id,
        TeamJoinRequest.status == "pending"
    )
    result = await session.execute(query)
    return result.scalar_one()


async def create_join_request(
    session: AsyncSession,
    team_id: uuid.UUID,
    user_id: uuid.UUID,
    message: str | None = None
) -> TeamJoinRequest:
    """Create a join request with validation."""
    # Validate: user not already in a team
    existing_membership = await get_team_by_user_id(session, user_id)
    if existing_membership:
        raise ValueError("User is already in a team")

    # Validate: no more than 3 pending requests
    pending_count = await get_join_request_count_for_user(session, user_id)
    if pending_count >= 3:
        raise ValueError("User has reached the maximum of 3 pending join requests")

    # Validate: team not full
    team = await get_team_by_id(session, team_id)
    if not team:
        raise ValueError("Team not found")

    member_count = len(team.members)
    if member_count >= team.max_size:
        raise ValueError("Team is full")

    # Check for existing request
    existing_query = select(TeamJoinRequest).where(
        TeamJoinRequest.team_id == team_id,
        TeamJoinRequest.user_id == user_id
    )
    existing_result = await session.execute(existing_query)
    existing_request = existing_result.scalar_one_or_none()

    if existing_request and existing_request.status == "pending":
        raise ValueError("A pending join request already exists for this team")

    # Create join request
    join_request = TeamJoinRequest(
        team_id=team_id,
        user_id=user_id,
        message=message,
        status="pending",
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    session.add(join_request)
    await session.commit()
    await session.refresh(join_request)

    return join_request


async def list_join_requests_for_team(
    session: AsyncSession,
    team_id: uuid.UUID,
    status: str = "pending"
) -> list[TeamJoinRequest]:
    """List join requests for a team (for leaders)."""
    query = (
        select(TeamJoinRequest)
        .options(selectinload(TeamJoinRequest.user))
        .where(TeamJoinRequest.team_id == team_id, TeamJoinRequest.status == status)
        .order_by(TeamJoinRequest.created_at.desc())
    )
    result = await session.execute(query)
    return list(result.scalars().all())


async def update_join_request_status(
    session: AsyncSession,
    request_id: uuid.UUID,
    status: str,
    reviewed_by: uuid.UUID
) -> TeamJoinRequest:
    """Approve or reject a join request."""
    query = select(TeamJoinRequest).where(TeamJoinRequest.id == request_id)
    result = await session.execute(query)
    join_request = result.scalar_one_or_none()

    if not join_request:
        raise ValueError("Join request not found")

    if join_request.status != "pending":
        raise ValueError("Can only update pending requests")

    # If approving, add member to team
    if status == "approved":
        team = await get_team_by_id(session, join_request.team_id)
        if not team:
            raise ValueError("Team not found")

        # Check team not full
        member_count = len(team.members)
        if member_count >= team.max_size:
            raise ValueError("Team is full")

        # Check user not already in a team
        user_team = await get_team_by_user_id(session, join_request.user_id)
        if user_team:
            raise ValueError("User is already in a team")

        # Add member
        await add_member(session, team, join_request.user_id)

    # Update request status
    join_request.status = status
    join_request.reviewed_by = reviewed_by
    join_request.reviewed_at = datetime.utcnow()
    await session.commit()
    await session.refresh(join_request)

    return join_request


async def withdraw_join_request(session: AsyncSession, request_id: uuid.UUID, user_id: uuid.UUID) -> None:
    """Withdraw a join request (by the user who created it)."""
    query = select(TeamJoinRequest).where(
        TeamJoinRequest.id == request_id,
        TeamJoinRequest.user_id == user_id
    )
    result = await session.execute(query)
    join_request = result.scalar_one_or_none()

    if not join_request:
        raise ValueError("Join request not found")

    if join_request.status != "pending":
        raise ValueError("Can only withdraw pending requests")

    join_request.status = "withdrawn"
    await session.commit()


async def expire_old_requests(session: AsyncSession) -> int:
    """Mark expired join requests. Returns count of expired requests."""
    query = select(TeamJoinRequest).where(
        TeamJoinRequest.status == "pending",
        TeamJoinRequest.expires_at < datetime.utcnow()
    )
    result = await session.execute(query)
    requests = result.scalars().all()

    count = 0
    for req in requests:
        req.status = "expired"
        count += 1

    if count > 0:
        await session.commit()

    return count
