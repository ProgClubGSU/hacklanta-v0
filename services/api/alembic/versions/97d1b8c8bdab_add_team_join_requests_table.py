"""add_team_join_requests_table

Revision ID: 97d1b8c8bdab
Revises: 6af66d3b27d6
Create Date: 2026-03-20 22:49:35.773039
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '97d1b8c8bdab'
down_revision: Union[str, None] = '6af66d3b27d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create team_join_requests table
    op.create_table(
        'team_join_requests',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('team_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(), server_default='pending', nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('reviewed_by', sa.UUID(), nullable=True),
        sa.Column('reviewed_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('team_id', 'user_id', name='uq_team_user_join_request')
    )

    # Create indexes
    op.create_index('idx_team_join_requests_team_id', 'team_join_requests', ['team_id'])
    op.create_index('idx_team_join_requests_user_id', 'team_join_requests', ['user_id'])
    op.create_index('idx_team_join_requests_status', 'team_join_requests', ['status'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_team_join_requests_status', table_name='team_join_requests')
    op.drop_index('idx_team_join_requests_user_id', table_name='team_join_requests')
    op.drop_index('idx_team_join_requests_team_id', table_name='team_join_requests')

    # Drop table
    op.drop_table('team_join_requests')
