"""Session presence table for admin usage metrics

Revision ID: 008_session_presence
Revises: 007_platform_settings
Create Date: 2026-06-08
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "008_session_presence"
down_revision: Union[str, None] = "007_platform_settings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "session_presence",
        sa.Column("session_id", sa.String(64), primary_key=True),
        sa.Column(
            "first_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("last_path", sa.String(256), nullable=True),
        sa.Column("user_agent_hash", sa.String(64), nullable=True),
        sa.Column("ip_hash", sa.String(64), nullable=True),
    )
    op.create_index(
        "idx_session_presence_last_seen",
        "session_presence",
        ["last_seen_at"],
    )
    op.create_index(
        "idx_session_presence_first_seen",
        "session_presence",
        ["first_seen_at"],
    )


def downgrade() -> None:
    op.drop_index("idx_session_presence_first_seen", table_name="session_presence")
    op.drop_index("idx_session_presence_last_seen", table_name="session_presence")
    op.drop_table("session_presence")
