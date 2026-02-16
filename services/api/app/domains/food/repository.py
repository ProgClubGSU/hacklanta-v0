import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.food.models import FoodMenuItem, FoodOrder, FoodOrderItem


async def list_menu_items(session: AsyncSession) -> list[FoodMenuItem]:
    result = await session.execute(
        select(FoodMenuItem).where(FoodMenuItem.available.is_(True)).order_by(FoodMenuItem.category)
    )
    return list(result.scalars().all())


async def get_menu_item(session: AsyncSession, item_id: uuid.UUID) -> FoodMenuItem | None:
    result = await session.execute(select(FoodMenuItem).where(FoodMenuItem.id == item_id))
    return result.scalar_one_or_none()


async def create_order(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    notes: str | None,
    items: list[dict],
) -> FoodOrder:
    order = FoodOrder(user_id=user_id, notes=notes)
    session.add(order)
    await session.flush()

    for item in items:
        order_item = FoodOrderItem(
            order_id=order.id,
            menu_item_id=item["menu_item_id"],
            quantity=item["quantity"],
        )
        session.add(order_item)

    await session.commit()
    await session.refresh(order, ["items"])
    return order


async def get_user_orders(session: AsyncSession, user_id: uuid.UUID) -> list[FoodOrder]:
    result = await session.execute(
        select(FoodOrder)
        .options(selectinload(FoodOrder.items))
        .where(FoodOrder.user_id == user_id)
        .order_by(FoodOrder.created_at.desc())
    )
    return list(result.scalars().all())


async def update_order_status(
    session: AsyncSession, order: FoodOrder, *, status: str
) -> FoodOrder:
    order.status = status
    await session.commit()
    await session.refresh(order)
    return order


async def create_menu_item(session: AsyncSession, *, data: dict) -> FoodMenuItem:
    item = FoodMenuItem(**data)
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return item


async def update_menu_item(
    session: AsyncSession, item: FoodMenuItem, *, data: dict
) -> FoodMenuItem:
    for key, value in data.items():
        if value is not None:
            setattr(item, key, value)
    await session.commit()
    await session.refresh(item)
    return item


async def delete_menu_item(session: AsyncSession, item: FoodMenuItem) -> None:
    await session.delete(item)
    await session.commit()


async def get_order_by_id(session: AsyncSession, order_id: uuid.UUID) -> FoodOrder | None:
    result = await session.execute(
        select(FoodOrder).options(selectinload(FoodOrder.items)).where(FoodOrder.id == order_id)
    )
    return result.scalar_one_or_none()


async def list_all_orders(
    session: AsyncSession, *, status_filter: str | None = None
) -> list[FoodOrder]:
    query = select(FoodOrder).options(selectinload(FoodOrder.items))
    if status_filter:
        query = query.where(FoodOrder.status == status_filter)
    query = query.order_by(FoodOrder.created_at.desc())
    result = await session.execute(query)
    return list(result.scalars().all())


async def list_all_menu_items(session: AsyncSession) -> list[FoodMenuItem]:
    result = await session.execute(select(FoodMenuItem).order_by(FoodMenuItem.category))
    return list(result.scalars().all())
