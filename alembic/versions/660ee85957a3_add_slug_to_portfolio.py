"""add_slug_to_portfolio

Revision ID: 660ee85957a3
Revises: 35df1329ae15
Create Date: 2026-10-14 20:25:06.073308

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '660ee85957a3'
down_revision: Union[str, None] = '35df1329ae15'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('portfolio') as batch_op:
        batch_op.add_column(sa.Column('slug', sa.String(length=255), nullable=True))
        batch_op.create_unique_constraint('uq_portfolio_slug', ['slug'])


def downgrade() -> None:
    with op.batch_alter_table('portfolio') as batch_op:
        batch_op.drop_constraint('uq_portfolio_slug', type_='unique')
        batch_op.drop_column('slug')
