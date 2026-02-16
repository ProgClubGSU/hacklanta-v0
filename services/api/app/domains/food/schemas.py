import uuid
from datetime import datetime

from pydantic import BaseModel


class MenuItemResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    category: str | None
    dietary_tags: list[str] | None
    available: bool
    max_quantity: int | None

    model_config = {"from_attributes": True}


class OrderItemCreate(BaseModel):
    menu_item_id: uuid.UUID
    quantity: int = 1


class OrderCreate(BaseModel):
    items: list[OrderItemCreate]
    notes: str | None = None


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    menu_item_id: uuid.UUID | None
    quantity: int

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    notes: str | None
    created_at: datetime
    items: list[OrderItemResponse] = []

    model_config = {"from_attributes": True}


class MenuItemCreate(BaseModel):
    name: str
    description: str | None = None
    category: str | None = None
    dietary_tags: list[str] | None = None
    available: bool = True
    max_quantity: int | None = None


class MenuItemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    dietary_tags: list[str] | None = None
    available: bool | None = None
    max_quantity: int | None = None


class OrderStatusUpdate(BaseModel):
    status: str  # 'placed' | 'preparing' | 'ready' | 'picked_up'
