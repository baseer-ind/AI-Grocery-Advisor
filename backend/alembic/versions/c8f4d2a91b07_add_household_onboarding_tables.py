"""add household, shopping_behaviors, shopping_styles tables

Revision ID: c8f4d2a91b07
Revises: a7c2e9f1b3d4
Create Date: 2026-06-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c8f4d2a91b07'
down_revision: Union[str, None] = 'a7c2e9f1b3d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'households',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), unique=True, nullable=True),
        sa.Column('size', sa.Integer(), nullable=False),
        sa.Column('adults', sa.Integer(), nullable=False),
        sa.Column('children', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('seniors', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('city', sa.String(length=128), nullable=False),
        sa.Column('monthly_grocery_budget', sa.Numeric(10, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_table(
        'shopping_behaviors',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('household_id', sa.Integer(), sa.ForeignKey('households.id'), unique=True, nullable=False),
        sa.Column('stores', sa.JSON(), nullable=False),
        sa.Column('frequency', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_table(
        'shopping_styles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('household_id', sa.Integer(), sa.ForeignKey('households.id'), unique=True, nullable=False),
        sa.Column('priorities', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('shopping_styles')
    op.drop_table('shopping_behaviors')
    op.drop_table('households')
