"""initial pricing schema: platforms, products, product_listings, price_history

These tables were originally created via `Base.metadata.create_all()`
against early dev databases and never captured as a migration, so
`cf367f1b212d` (which alters/indexes them) silently assumed they already
existed. This migration creates them from scratch so a brand-new database
can run the full chain.

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-06-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'platforms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=64), nullable=False),
        sa.Column('slug', sa.String(length=64), nullable=False),
        sa.Column('logo_url', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('slug'),
    )
    op.create_table(
        'products',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('brand', sa.String(length=128), nullable=False),
        sa.Column('category', sa.String(length=128), nullable=False),
        sa.Column('canonical_quantity', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('canonical_unit', sa.String(length=16), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'product_listings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('platform_id', sa.Integer(), nullable=False),
        sa.Column('mrp', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('selling_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('delivery_fee', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('platform_fee', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('handling_fee', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('product_rating', sa.Numeric(precision=3, scale=2), nullable=False),
        sa.Column('delivery_rating', sa.Numeric(precision=3, scale=2), nullable=False),
        sa.Column('eta_minutes', sa.Integer(), nullable=False),
        sa.Column('in_stock', sa.Boolean(), nullable=False),
        sa.Column('product_url', sa.String(length=512), nullable=False),
        sa.Column('last_updated', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.ForeignKeyConstraint(['platform_id'], ['platforms.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'price_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('listing_id', sa.Integer(), nullable=False),
        sa.Column('selling_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('recorded_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['listing_id'], ['product_listings.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('price_history')
    op.drop_table('product_listings')
    op.drop_table('products')
    op.drop_table('platforms')
