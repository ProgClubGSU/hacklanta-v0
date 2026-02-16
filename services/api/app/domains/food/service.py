import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.applicants.service import resolve_user_id
from app.domains.food import repository
from app.domains.food.models import FoodMenuItem, FoodOrder
from app.domains.food.schemas import MenuItemCreate, MenuItemUpdate, OrderCreate


async def list_menu(session: AsyncSession) -> list[FoodMenuItem]:
    return await repository.list_menu_items(session)


async def place_order(
    session: AsyncSession,
    *,
    clerk_id: str,
    data: OrderCreate,
) -> FoodOrder:
    user_id = await resolve_user_id(session, clerk_id)

    # Validate menu items exist
    for item in data.items:
        menu_item = await repository.get_menu_item(session, item.menu_item_id)
        if menu_item is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Menu item {item.menu_item_id} not found.",
            )
        if not menu_item.available:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Menu item '{menu_item.name}' is not available.",
            )

    items = [{"menu_item_id": i.menu_item_id, "quantity": i.quantity} for i in data.items]
    return await repository.create_order(session, user_id=user_id, notes=data.notes, items=items)


async def get_my_orders(
    session: AsyncSession,
    *,
    clerk_id: str,
) -> list[FoodOrder]:
    user_id = await resolve_user_id(session, clerk_id)
    return await repository.get_user_orders(session, user_id)


# --- Admin functions ---


async def create_menu_item(
    session: AsyncSession, *, data: MenuItemCreate
) -> FoodMenuItem:
    return await repository.create_menu_item(session, data=data.model_dump())


async def update_menu_item(
    session: AsyncSession,
    *,
    item_id: uuid.UUID,
    data: MenuItemUpdate,
) -> FoodMenuItem:
    item = await repository.get_menu_item(session, item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found.",
        )
    return await repository.update_menu_item(
        session, item, data=data.model_dump(exclude_unset=True)
    )


async def delete_menu_item(session: AsyncSession, *, item_id: uuid.UUID) -> None:
    item = await repository.get_menu_item(session, item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found.",
        )
    await repository.delete_menu_item(session, item)


async def list_all_orders(
    session: AsyncSession, *, status_filter: str | None = None
) -> list[FoodOrder]:
    return await repository.list_all_orders(session, status_filter=status_filter)


async def update_order_status(
    session: AsyncSession,
    *,
    order_id: uuid.UUID,
    new_status: str,
) -> FoodOrder:
    valid_statuses = {"placed", "preparing", "ready", "picked_up"}
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Status must be one of: {', '.join(valid_statuses)}",
        )

    order = await repository.get_order_by_id(session, order_id)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )
    return await repository.update_order_status(session, order, status=new_status)


async def list_all_menu_items(session: AsyncSession) -> list[FoodMenuItem]:
    return await repository.list_all_menu_items(session)
