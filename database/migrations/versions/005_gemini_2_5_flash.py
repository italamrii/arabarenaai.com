"""Update Google Gemini model key to verified API id gemini-2.5-flash

Revision ID: 005_gemini_2_5_flash
Revises: 004_claude_sonnet_4_6
Create Date: 2026-06-07
"""

from alembic import op


revision = "005_gemini_2_5_flash"
down_revision = "004_claude_sonnet_4_6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE models
        SET
            key = 'gemini-2.5-flash',
            name_ar = 'Gemini 2.5 Flash',
            name_en = 'Gemini 2.5 Flash'
        WHERE key IN ('gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro')
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE models
        SET
            key = 'gemini-1.5-pro',
            name_ar = 'Gemini 1.5 Pro',
            name_en = 'Gemini 1.5 Pro'
        WHERE key = 'gemini-2.5-flash'
        """
    )
