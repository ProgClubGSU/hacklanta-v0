import math

from pydantic import BaseModel


class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int


class PaginatedResponse[T](BaseModel):
    data: list[T]
    meta: PaginationMeta


def paginate[T](items: list[T], total: int, params: PaginationParams) -> PaginatedResponse[T]:
    return PaginatedResponse(
        data=items,
        meta=PaginationMeta(
            total=total,
            page=params.page,
            page_size=params.page_size,
            total_pages=math.ceil(total / params.page_size) if params.page_size > 0 else 0,
        ),
    )
