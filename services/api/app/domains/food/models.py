import uuid
from datetime import datetime

from sqlalchemy import ARRAY, Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, UUIDMixin


class FoodMenuItem(UUIDMixin, Base):
    __tablename__ = "food_menu_items"

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String)
    dietary_tags: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    available: Mapped[bool] = mapped_column(Boolean, default=True)
    max_quantity: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class FoodOrder(UUIDMixin, Base):
    __tablename__ = "food_orders"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String, default="placed")
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user = relationship("User")
    items = relationship("FoodOrderItem", back_populates="order")


class FoodOrderItem(UUIDMixin, Base):
    __tablename__ = "food_order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("food_orders.id", ondelete="CASCADE"), nullable=False
    )
    menu_item_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("food_menu_items.id"))
    quantity: Mapped[int] = mapped_column(Integer, default=1)

    order = relationship("FoodOrder", back_populates="items")
    menu_item = relationship("FoodMenuItem")
