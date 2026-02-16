import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import CurrentUser
from app.domains.contestants import service
from app.domains.contestants.repository import list_teams
from app.domains.contestants.schemas import (
    TeamCreate,
    TeamJoin,
    TeamListItem,
    TeamResponse,
)
from app.utils.pagination import PaginatedResponse, PaginationParams, paginate

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post(
    "",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_team(
    data: TeamCreate,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TeamResponse:
    """Create a new team. The creator is automatically added as leader."""
    team = await service.create_team(session, clerk_id=user["sub"], data=data)
    return TeamResponse.model_validate(team)


@router.post("/join", response_model=TeamResponse)
async def join_team(
    data: TeamJoin,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TeamResponse:
    """Join a team via invite code."""
    team = await service.join_team(session, clerk_id=user["sub"], invite_code=data.invite_code)
    return TeamResponse.model_validate(team)


@router.get("/me", response_model=TeamResponse)
async def get_my_team(
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TeamResponse:
    """Get the current user's team."""
    team = await service.get_my_team(session, clerk_id=user["sub"])
    return TeamResponse.model_validate(team)


@router.get("", response_model=PaginatedResponse[TeamListItem])
async def browse_teams(
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 20,
) -> PaginatedResponse[TeamListItem]:
    """Browse teams looking for members."""
    _ = user  # require auth but don't need user data
    params = PaginationParams(page=page, page_size=page_size)
    teams, total = await list_teams(session, offset=params.offset, limit=params.limit)
    items = [TeamListItem(**t) for t in teams]
    return paginate(items, total, params)


@router.delete(
    "/{team_id}/members/me",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def leave_team(
    team_id: uuid.UUID,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> None:
    """Leave a team."""
    await service.leave_team(session, clerk_id=user["sub"], team_id=team_id)
