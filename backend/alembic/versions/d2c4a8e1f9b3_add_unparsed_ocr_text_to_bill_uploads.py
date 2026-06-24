"""add unparsed_ocr_text to bill_uploads

Stores the raw OCR text for uploads where the rule-based parser found zero
line items, so unsupported bill formats can be reviewed and turned into new
regex patterns (or fed to an LLM fallback later) instead of being a dead end.

Revision ID: d2c4a8e1f9b3
Revises: e7a1c9d3f456
Create Date: 2026-06-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd2c4a8e1f9b3'
down_revision: Union[str, None] = 'e7a1c9d3f456'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('bill_uploads', sa.Column('unparsed_ocr_text', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('bill_uploads', 'unparsed_ocr_text')
