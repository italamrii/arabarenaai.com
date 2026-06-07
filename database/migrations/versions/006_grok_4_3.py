"""Update xAI Grok model key to verified API id grok-4.3

Revision ID: 006_grok_4_3
Revises: 005_gemini_2_5_flash
Create Date: 2026-06-07
"""

from alembic import op


revision = "006_grok_4_3"
down_revision = "005_gemini_2_5_flash"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE models
        SET key = 'grok-4.3'
        WHERE key = 'grok-beta'
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE models
        SET key = 'grok-beta'
        WHERE key = 'grok-4.3'
        """
    )
