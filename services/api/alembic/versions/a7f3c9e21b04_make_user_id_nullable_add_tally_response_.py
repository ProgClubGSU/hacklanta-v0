"""make user_id nullable, add tally_response_id

Revision ID: a7f3c9e21b04
Revises: 2cbdb5dd7a3e
Create Date: 2026-02-21 12:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7f3c9e21b04'
down_revision: Union[str, None] = '2cbdb5dd7a3e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make user_id nullable (Tally webhook submissions don't have a linked user)
    op.alter_column(
        'applications',
        'user_id',
        existing_type=sa.UUID(),
        nullable=True,
    )
    # Add tally_response_id for deduplication
    op.add_column(
        'applications',
        sa.Column('tally_response_id', sa.String(), nullable=True),
    )
    op.create_unique_constraint(
        'uq_applications_tally_response_id',
        'applications',
        ['tally_response_id'],
    )


def downgrade() -> None:
    op.drop_constraint('uq_applications_tally_response_id', 'applications', type_='unique')
    op.drop_column('applications', 'tally_response_id')
    op.alter_column(
        'applications',
        'user_id',
        existing_type=sa.UUID(),
        nullable=False,
    )
