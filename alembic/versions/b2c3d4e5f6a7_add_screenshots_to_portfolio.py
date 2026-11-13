"""add screenshots to portfolio

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-11-13 13:54:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('portfolio', sa.Column('screenshots', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('portfolio', 'screenshots')
