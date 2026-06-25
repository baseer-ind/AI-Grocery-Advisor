"""rename baskets to shopping_events, add household/intelligence fields

Revision ID: d4f8a1c92e6b
Revises: c8f4d2a91b07
Create Date: 2026-06-25 00:00:00.000001

`basket_items` keeps its table name (only the ORM class became
`ShoppingEventItem`) — only the FK target column changes, since nothing
besides the parent table identity needed to change for items.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4f8a1c92e6b'
down_revision: Union[str, None] = 'c8f4d2a91b07'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.rename_table('baskets', 'shopping_events')

    op.add_column('shopping_events', sa.Column('household_id', sa.Integer(), sa.ForeignKey('households.id'), nullable=True))
    op.add_column('shopping_events', sa.Column('purchase_method', sa.String(length=16), nullable=True, server_default='in_store'))
    op.add_column('shopping_events', sa.Column('receipt_source', sa.String(length=16), nullable=False, server_default='bill'))
    op.add_column('shopping_events', sa.Column('total_spend', sa.Numeric(10, 2), nullable=True))

    op.execute(
        """
        UPDATE shopping_events
        SET household_id = households.id
        FROM households
        WHERE households.user_id = shopping_events.user_id
        """
    )
    op.execute("UPDATE shopping_events SET receipt_source = 'manual' WHERE source = 'manual'")
    op.execute(
        """
        UPDATE shopping_events
        SET total_spend = sub.sum_total
        FROM (
            SELECT basket_id, SUM(total_price) AS sum_total
            FROM basket_items
            GROUP BY basket_id
        ) AS sub
        WHERE shopping_events.id = sub.basket_id
        """
    )


def downgrade() -> None:
    op.drop_column('shopping_events', 'total_spend')
    op.drop_column('shopping_events', 'receipt_source')
    op.drop_column('shopping_events', 'purchase_method')
    op.drop_column('shopping_events', 'household_id')
    op.rename_table('shopping_events', 'baskets')
