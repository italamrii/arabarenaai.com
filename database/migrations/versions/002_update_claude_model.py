"""Update Claude model id

Revision ID: 002_update_claude_model
Revises: 001_initial
Create Date: 2026-06-07
"""

from alembic import op


revision = "002_update_claude_model"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE models
        SET
            key = 'claude-sonnet-4-20250514',
            name_ar = 'Claude Sonnet 4',
            name_en = 'Claude Sonnet 4'
        WHERE key = 'claude-3-5-sonnet-20241022'
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE models
        SET
            key = 'claude-3-5-sonnet-20241022',
            name_ar = 'Claude 3.5 Sonnet',
            name_en = 'Claude 3.5 Sonnet'
        WHERE key = 'claude-sonnet-4-20250514'
        """
    )