import uuid

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
