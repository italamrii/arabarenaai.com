"""Use Anthropic Messages API alias for Claude Sonnet 4

Revision ID: 003_claude_sonnet_alias
Revises: 002_update_claude_model
Create Date: 2026-06-07
"""

from alembic import op


revision = "003_claude_sonnet_alias"
down_revision = "002_update_claude_model"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE models
        SET
            key = 'claude-sonnet-4-0',
            name_ar = 'Claude Sonnet 4',
            name_en = 'Claude Sonnet 4'
        WHERE key IN ('claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022')
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE models
        SET
            key = 'claude-sonnet-4-20250514',
            name_ar = 'Claude Sonnet 4',
            name_en = 'Claude Sonnet 4'
        WHERE key = 'claude-sonnet-4-0'
        """
    )
