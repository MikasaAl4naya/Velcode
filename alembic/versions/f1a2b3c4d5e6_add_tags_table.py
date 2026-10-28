"""add tags table and portfolio_tag join

Revision ID: f1a2b3c4d5e6
Revises: e2f3a4b5c6d7
Create Date: 2026-10-29 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'e2f3a4b5c6d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )
    op.create_table(
        'portfolio_tag',
        sa.Column('portfolio_id', sa.Integer(), sa.ForeignKey('portfolio.id'), primary_key=True),
        sa.Column('tag_id', sa.Integer(), sa.ForeignKey('tags.id'), primary_key=True),
    )


def downgrade() -> None:
    op.drop_table('portfolio_tag')
    op.drop_table('tags')
