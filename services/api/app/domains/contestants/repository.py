import secrets
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.contestants.models import Team, TeamMember


def _generate_invite_code() -> str:
    return secrets.token_urlsafe(6)[:8].upper()


async def create_team(
    session: AsyncSession,
    *,
    name: str,
    description: str | None,
    max_size: int,
    created_by: uuid.UUID,
) -> Team:
    team = Team(
        name=name,
        description=description,
        max_size=max_size,
        invite_code=_generate_invite_code(),
        created_by=created_by,
    )
    session.add(team)
    await session.flush()

    # Add creator as leader
    member = TeamMember(team_id=team.id, user_id=created_by, role="leader")
    session.add(member)
    await session.commit()
    await session.refresh(team, ["members"])
    return team


async def get_team_by_id(
    session: AsyncSession, team_id: uuid.UUID
) -> Team | None:
    result = await session.execute(
        select(Team).options(selectinload(Team.members)).where(Team.id == team_id)
    )
    return result.scalar_one_or_none()


async def get_team_by_invite_code(
    session: AsyncSession, invite_code: str
) -> Team | None:
    result = await session.execute(
        select(Team).options(selectinload(Team.members)).where(Team.invite_code == invite_code)
    )
    return result.scalar_one_or_none()


async def get_user_team(
    session: AsyncSession, user_id: uuid.UUID
) -> Team | None:
    result = await session.execute(
        select(Team)
        .options(selectinload(Team.members))
        .join(TeamMember)
        .where(TeamMember.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def add_member(
    session: AsyncSession,
    *,
    team_id: uuid.UUID,
    user_id: uuid.UUID,
    role: str = "member",
) -> TeamMember:
    member = TeamMember(team_id=team_id, user_id=user_id, role=role)
    session.add(member)
    await session.commit()
    await session.refresh(member)
    return member


async def remove_member(
    session: AsyncSession,
    *,
    team_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    result = await session.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        return False
    await session.delete(member)
    await session.commit()
    return True


async def list_teams(
    session: AsyncSession,
    *,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[dict], int]:
    """List teams with member counts. Returns list of dicts and total count."""
    count_query = select(func.count()).select_from(Team)
    total_result = await session.execute(count_query)
    total = total_result.scalar_one()

    query = (
        select(
            Team.id,
            Team.name,
            Team.description,
            Team.max_size,
            Team.created_at,
            func.count(TeamMember.id).label("member_count"),
        )
        .outerjoin(TeamMember)
        .group_by(Team.id)
        .order_by(Team.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await session.execute(query)
    teams = [dict(row._mapping) for row in result.all()]

    return teams, total
