import uuid
from datetime import datetime

from pydantic import BaseModel


class TeamCreate(BaseModel):
    name: str
    description: str | None = None
    max_size: int = 4


class TeamJoin(BaseModel):
    invite_code: str


class TeamMemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class TeamResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    invite_code: str
    max_size: int
    created_by: uuid.UUID | None
    created_at: datetime
    members: list[TeamMemberResponse] = []

    model_config = {"from_attributes": True}


class TeamListItem(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    max_size: int
    member_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
