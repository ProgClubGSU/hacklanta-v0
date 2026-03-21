"""merge_heads

Revision ID: 6af66d3b27d6
Revises: a7f3c9e21b04, b7d1a2c3e4f5
Create Date: 2026-03-20 22:49:26.034236
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6af66d3b27d6'
down_revision: Union[str, None] = ('a7f3c9e21b04', 'b7d1a2c3e4f5')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
