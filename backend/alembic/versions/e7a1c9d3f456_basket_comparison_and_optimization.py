"""basket comparison and optimization

Revision ID: e7a1c9d3f456
Revises: b4e5797fc834
Create Date: 2026-06-22 10:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7a1c9d3f456'
down_revision: Union[str, None] = 'b4e5797fc834'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'baskets',
        sa.Column('source', sa.String(length=32), nullable=False, server_default='manual'),
    )
    op.add_column('baskets', sa.Column('location_key', sa.String(length=64), nullable=True))
    op.create_table(
        'basket_optimizations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('basket_id', sa.Integer(), nullable=False),
        sa.Column('optimization_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['basket_id'], ['baskets.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('basket_id'),
    )
    # Existing baskets all came from the bill-upload pipeline; the
    # server_default above only covers the column's *future* default, so
    # backfill rows created before this migration explicitly.
    op.execute("UPDATE baskets SET source = 'bill_upload' WHERE bill_upload_id IS NOT NULL")


def downgrade() -> None:
    op.drop_table('basket_optimizations')
    op.drop_column('baskets', 'location_key')
    op.drop_column('baskets', 'source')
