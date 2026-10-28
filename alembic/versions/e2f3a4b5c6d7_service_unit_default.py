"""service_unit_default

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-10-16 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e2f3a4b5c6d7'
down_revision: Union[str, None] = 'd1e2f3a4b5c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('services') as batch_op:
        batch_op.alter_column('unit', server_default='за проект')


def downgrade() -> None:
    with op.batch_alter_table('services') as batch_op:
        batch_op.alter_column('unit', server_default=None)
