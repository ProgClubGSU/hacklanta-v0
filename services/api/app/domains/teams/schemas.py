import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)


class JoinTeamRequest(BaseModel):
    invite_code: str = Field(..., min_length=6, max_length=20)


class TeamMemberRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    role: str
    
    # Nested user data for UI convenience
    first_name: str | None = None
    last_name: str | None = None
    avatar_url: str | None = None
    email: str | None = None
    
    model_config = ConfigDict(from_attributes=True)


class TeamRead(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    invite_code: str
    max_size: int
    is_looking_for_members: bool
    created_by: uuid.UUID
    members: list[TeamMemberRead] = []

    model_config = ConfigDict(from_attributes=True)


# Join Request Schemas
class JoinRequestCreate(BaseModel):
    message: str | None = Field(None, max_length=500)


class JoinRequestUpdate(BaseModel):
    status: Literal["approved", "rejected"]


class JoinRequestRead(BaseModel):
    id: uuid.UUID
    team_id: uuid.UUID
    user_id: uuid.UUID
    status: str
    message: str | None
    expires_at: datetime
    created_at: datetime

    # Nested user info
    user_first_name: str | None = None
    user_last_name: str | None = None
    user_avatar_url: str | None = None
    user_email: str | None = None

    model_config = ConfigDict(from_attributes=True)


# Team List/Browse Schemas
class TeamListItem(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    member_count: int
    max_size: int
    is_full: bool
    is_looking_for_members: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TeamDetailRead(TeamRead):
    """Extended team details including current user's join request status"""
    join_request_status: str | None = None  # "pending" | "approved" | "rejected" | "withdrawn" | "expired" | None
    join_request_id: uuid.UUID | None = None
