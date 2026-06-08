"""Model registry fields: supports_attachments, is_archived

Revision ID: 009_model_registry_fields
Revises: 008_session_presence
Create Date: 2026-06-08
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "009_model_registry_fields"
down_revision: Union[str, None] = "008_session_presence"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "models",
        sa.Column(
            "supports_attachments",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "models",
        sa.Column(
            "is_archived",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.execute(
        """
        UPDATE models m
        SET supports_attachments = true
        FROM providers p
        WHERE m.provider_id = p.id
          AND p.key IN ('openai', 'anthropic', 'google')
          AND m.is_placeholder = false
        """
    )


def downgrade() -> None:
    op.drop_column("models", "is_archived")
    op.drop_column("models", "supports_attachments")
