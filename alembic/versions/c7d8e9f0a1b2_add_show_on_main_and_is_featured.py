"""add_show_on_main_and_is_featured

Revision ID: c7d8e9f0a1b2
Revises: 55876a02c739
Create Date: 2026-10-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c7d8e9f0a1b2'
down_revision: Union[str, None] = '55876a02c739'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('portfolio', sa.Column('show_on_main', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('services', sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('portfolio', 'show_on_main')
    op.drop_column('services', 'is_featured')
