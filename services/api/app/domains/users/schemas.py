import uuid
from datetime import datetime

from pydantic import BaseModel


class UserResponse(BaseModel):
    id: uuid.UUID
    clerk_id: str
    email: str
    first_name: str | None
    last_name: str | None
    avatar_url: str | None
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListItem(BaseModel):
    """User with optional profile and team info for browsing."""
    id: uuid.UUID
    clerk_id: str
    email: str
    first_name: str | None
    last_name: str | None
    avatar_url: str | None
    # Profile and team info can be added as separate fields in the response
    # to avoid circular dependencies

    model_config = {"from_attributes": True}
