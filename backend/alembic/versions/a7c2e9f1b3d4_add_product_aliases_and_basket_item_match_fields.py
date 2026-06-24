"""add product_aliases table and basket_item match/review fields

Revision ID: a7c2e9f1b3d4
Revises: f3a7b6c9d0e2
Create Date: 2026-06-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a7c2e9f1b3d4'
down_revision: Union[str, None] = 'f3a7b6c9d0e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'product_aliases',
        sa.Column('alias_id', sa.Integer(), primary_key=True),
        sa.Column('raw_text', sa.String(length=255), nullable=False),
        sa.Column('canonical_product_id', sa.Integer(), sa.ForeignKey('products.id'), nullable=False),
        sa.Column('confidence_score', sa.Numeric(4, 3), nullable=False, server_default='1.0'),
        sa.Column('source_bill_id', sa.Integer(), sa.ForeignKey('bill_uploads.id'), nullable=True),
        sa.Column('user_confirmed', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('times_seen', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_product_aliases_canonical_product', 'product_aliases', ['canonical_product_id'])
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute(
        "CREATE INDEX ix_product_aliases_raw_text_trgm ON product_aliases USING gin (raw_text gin_trgm_ops)"
    )

    op.add_column('basket_items', sa.Column('matched_product_id', sa.Integer(), sa.ForeignKey('products.id'), nullable=True))
    op.add_column('basket_items', sa.Column('match_confidence', sa.Numeric(4, 3), nullable=True))
    op.add_column('basket_items', sa.Column('match_tier', sa.String(length=16), nullable=True))
    op.add_column(
        'basket_items',
        sa.Column('review_status', sa.String(length=16), nullable=False, server_default='auto_confirmed'),
    )


def downgrade() -> None:
    op.drop_column('basket_items', 'review_status')
    op.drop_column('basket_items', 'match_tier')
    op.drop_column('basket_items', 'match_confidence')
    op.drop_column('basket_items', 'matched_product_id')

    op.execute("DROP INDEX IF EXISTS ix_product_aliases_raw_text_trgm")
    op.drop_index('ix_product_aliases_canonical_product', table_name='product_aliases')
    op.drop_table('product_aliases')
