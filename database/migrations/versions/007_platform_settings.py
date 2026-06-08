"""Platform settings table for maintenance mode

Revision ID: 007_platform_settings
Revises: 006_grok_4_3
Create Date: 2026-06-08
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "007_platform_settings"
down_revision: Union[str, None] = "006_grok_4_3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "platform_settings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("key", sa.String(64), nullable=False, unique=True),
        sa.Column("value", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.execute(
        """
        INSERT INTO platform_settings (id, key, value)
        VALUES (
            '00000000-0000-4000-8000-000000000001',
            'maintenance_mode',
            '{"enabled": false, "message_ar": "نقوم حالياً بأعمال صيانة وتحسينات على المنصة. سنعود قريباً.", "message_en": "We are performing maintenance and improvements. We will be back soon.", "estimated_return": "قريباً"}'::jsonb
        )
        ON CONFLICT (key) DO NOTHING
        """
    )


def downgrade() -> None:
    op.drop_table("platform_settings")
