import uuid

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class ProfileBase(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=100)
    bio: str | None = Field(None, max_length=500)
    linkedin_url: str | None = Field(None, max_length=200)
    github_url: str | None = Field(None, max_length=200)
    portfolio_url: str | None = Field(None, max_length=200)
    looking_for_team: bool = True


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(ProfileBase):
    pass


class ProfileRead(ProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    
    model_config = ConfigDict(from_attributes=True)
