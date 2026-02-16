import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.redis import redis_client
from app.core.security import AdminUser, CurrentUser
from app.domains.food import service
from app.domains.food.schemas import (
    MenuItemCreate,
    MenuItemResponse,
    MenuItemUpdate,
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
)

router = APIRouter(prefix="/food", tags=["food"])

FOOD_ORDERING_FLAG = "feature:food_ordering_enabled"


async def require_food_ordering_enabled() -> None:
    """Dependency that blocks user-facing food routes when ordering is disabled."""
    enabled = await redis_client.get(FOOD_ORDERING_FLAG)
    if enabled != "1":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Food ordering is currently closed.",
        )


@router.get("/status")
async def food_ordering_status(_user: CurrentUser) -> dict:
    """Check if food ordering is currently open."""
    enabled = await redis_client.get(FOOD_ORDERING_FLAG)
    return {"enabled": enabled == "1"}


@router.get(
    "/menu",
    response_model=list[MenuItemResponse],
    dependencies=[Depends(require_food_ordering_enabled)],
)
async def list_menu(
    _user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[MenuItemResponse]:
    """Get the food menu (available items only)."""
    items = await service.list_menu(session)
    return [MenuItemResponse.model_validate(i) for i in items]


@router.post(
    "/orders",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_food_ordering_enabled)],
)
async def place_order(
    data: OrderCreate,
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> OrderResponse:
    """Place a food order."""
    order = await service.place_order(session, clerk_id=user["sub"], data=data)
    return OrderResponse.model_validate(order)


@router.get(
    "/orders/me",
    response_model=list[OrderResponse],
    dependencies=[Depends(require_food_ordering_enabled)],
)
async def get_my_orders(
    user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[OrderResponse]:
    """Get the current user's food orders."""
    orders = await service.get_my_orders(session, clerk_id=user["sub"])
    return [OrderResponse.model_validate(o) for o in orders]


# --- Admin endpoints ---


@router.get("/admin/menu", response_model=list[MenuItemResponse])
async def admin_list_menu(
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[MenuItemResponse]:
    """List all menu items including unavailable ones (admin only)."""
    items = await service.list_all_menu_items(session)
    return [MenuItemResponse.model_validate(i) for i in items]


@router.post(
    "/admin/menu",
    response_model=MenuItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_menu_item(
    data: MenuItemCreate,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> MenuItemResponse:
    """Create a new menu item (admin only)."""
    item = await service.create_menu_item(session, data=data)
    return MenuItemResponse.model_validate(item)


@router.patch("/admin/menu/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    item_id: uuid.UUID,
    data: MenuItemUpdate,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> MenuItemResponse:
    """Update a menu item (admin only)."""
    item = await service.update_menu_item(session, item_id=item_id, data=data)
    return MenuItemResponse.model_validate(item)


@router.delete("/admin/menu/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    item_id: uuid.UUID,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> None:
    """Delete a menu item (admin only)."""
    await service.delete_menu_item(session, item_id=item_id)


@router.get("/admin/orders", response_model=list[OrderResponse])
async def admin_list_orders(
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    status_filter: Annotated[str | None, Query(alias="status")] = None,
) -> list[OrderResponse]:
    """List all food orders with optional status filter (admin only)."""
    orders = await service.list_all_orders(session, status_filter=status_filter)
    return [OrderResponse.model_validate(o) for o in orders]


@router.patch("/admin/orders/{order_id}", response_model=OrderResponse)
async def admin_update_order_status(
    order_id: uuid.UUID,
    data: OrderStatusUpdate,
    _admin: AdminUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> OrderResponse:
    """Update an order's status (admin only)."""
    order = await service.update_order_status(
        session, order_id=order_id, new_status=data.status
    )
    return OrderResponse.model_validate(order)


@router.post("/admin/toggle")
async def toggle_food_ordering(
    _admin: AdminUser,
) -> dict:
    """Enable or disable food ordering (admin only). Toggles the current state."""
    current = await redis_client.get(FOOD_ORDERING_FLAG)
    new_value = "0" if current == "1" else "1"
    await redis_client.set(FOOD_ORDERING_FLAG, new_value)
    return {"enabled": new_value == "1"}
