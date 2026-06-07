"""Point Claude Sonnet model at Anthropic /v1/models id claude-sonnet-4-6

Revision ID: 004_claude_sonnet_4_6
Revises: 003_claude_sonnet_alias
Create Date: 2026-06-07
"""

from alembic import op


revision = "004_claude_sonnet_4_6"
down_revision = "003_claude_sonnet_alias"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE models
        SET
            key = 'claude-sonnet-4-6',
            name_ar = 'Claude Sonnet 4.6',
            name_en = 'Claude Sonnet 4.6'
        WHERE key IN (
            'claude-sonnet-4-0',
            'claude-sonnet-4-20250514',
            'claude-3-5-sonnet-20241022'
        )
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE models
        SET
            key = 'claude-sonnet-4-0',
            name_ar = 'Claude Sonnet 4',
            name_en = 'Claude Sonnet 4'
        WHERE key = 'claude-sonnet-4-6'
        """
    )
