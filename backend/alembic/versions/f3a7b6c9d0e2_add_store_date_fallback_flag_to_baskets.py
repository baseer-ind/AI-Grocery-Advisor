"""add store_name, bill_date, used_llm_fallback to baskets

Revision ID: f3a7b6c9d0e2
Revises: d2c4a8e1f9b3
Create Date: 2026-06-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f3a7b6c9d0e2'
down_revision: Union[str, None] = 'd2c4a8e1f9b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('baskets', sa.Column('store_name', sa.String(length=64), nullable=True))
    op.add_column('baskets', sa.Column('bill_date', sa.String(length=32), nullable=True))
    op.add_column(
        'baskets',
        sa.Column('used_llm_fallback', sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column('baskets', 'used_llm_fallback')
    op.drop_column('baskets', 'bill_date')
    op.drop_column('baskets', 'store_name')
