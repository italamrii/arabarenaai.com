"""Initial schema with seeds

Revision ID: 001_initial
Revises:
Create Date: 2025-06-07
"""

from typing import Sequence, Union
import uuid

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "providers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("key", sa.String(32), nullable=False, unique=True),
        sa.Column("name_ar", sa.String(128), nullable=False),
        sa.Column("name_en", sa.String(128), nullable=True),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("config", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "prompt_categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("key", sa.String(32), nullable=False, unique=True),
        sa.Column("name_ar", sa.String(128), nullable=False),
        sa.Column("name_en", sa.String(128), nullable=False),
        sa.Column("sort_order", sa.SmallInteger(), nullable=False, server_default="0"),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=True),
        sa.Column("display_name", sa.String(128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "agents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("key", sa.String(64), nullable=False, unique=True),
        sa.Column("name_ar", sa.String(128), nullable=False),
        sa.Column("description_ar", sa.Text(), nullable=True),
        sa.Column("provider_key", sa.String(32), nullable=False),
        sa.Column("config_schema", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "models",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("provider_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("providers.id"), nullable=False),
        sa.Column("key", sa.String(64), nullable=False, unique=True),
        sa.Column("name_ar", sa.String(128), nullable=False),
        sa.Column("name_en", sa.String(128), nullable=True),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_placeholder", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("sort_order", sa.SmallInteger(), nullable=False, server_default="0"),
        sa.Column("max_tokens", sa.Integer(), nullable=False, server_default="4096"),
        sa.Column("timeout_ms", sa.Integer(), nullable=False, server_default="30000"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_models_provider_enabled", "models", ["provider_id", "is_enabled"])

    op.create_table(
        "prompts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("char_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_prompts_content_hash", "prompts", ["content_hash"])

    op.create_table(
        "comparisons",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("prompt_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("prompts.id"), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("prompt_categories.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("session_id", sa.String(64), nullable=False),
        sa.Column("category_source", sa.String(10), nullable=False),
        sa.Column("category_confidence", sa.Numeric(4, 3), nullable=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("target_count", sa.SmallInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("target_count BETWEEN 2 AND 10", name="ck_comparisons_target_count"),
    )
    op.create_index("idx_comparisons_session_created", "comparisons", ["session_id", "created_at"])
    op.create_index("idx_comparisons_category_created", "comparisons", ["category_id", "created_at"])

    op.create_table(
        "comparison_targets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("comparison_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("comparisons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("model_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("models.id"), nullable=True),
        sa.Column("agent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("agents.id"), nullable=True),
        sa.Column("position", sa.SmallInteger(), nullable=False),
    )
    op.create_index("idx_comparison_targets_comparison", "comparison_targets", ["comparison_id"])

    op.create_table(
        "responses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("comparison_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("comparisons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("model_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("models.id"), nullable=True),
        sa.Column("agent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("agents.id"), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("content_structured", postgresql.JSONB(), nullable=True),
        sa.Column("response_time_ms", sa.Integer(), nullable=True),
        sa.Column("input_tokens", sa.Integer(), nullable=True),
        sa.Column("output_tokens", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_responses_comparison", "responses", ["comparison_id"])

    op.create_table(
        "votes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("comparison_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("comparisons.id"), nullable=False),
        sa.Column("response_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("responses.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("session_id", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("comparison_id", "session_id", name="uq_votes_comparison_session"),
    )
    op.create_index("idx_votes_response", "votes", ["response_id"])
    op.create_index("idx_votes_created", "votes", ["created_at"])

    _seed()


def _seed() -> None:
    providers = {
        "openai": uuid.uuid4(),
        "anthropic": uuid.uuid4(),
        "google": uuid.uuid4(),
        "deepseek": uuid.uuid4(),
        "qwen": uuid.uuid4(),
        "xai": uuid.uuid4(),
        "allam": uuid.uuid4(),
    }
    provider_names = {
        "openai": ("OpenAI", "OpenAI"),
        "anthropic": ("Anthropic", "Anthropic"),
        "google": ("Google", "Google"),
        "deepseek": ("DeepSeek", "DeepSeek"),
        "qwen": ("Qwen", "Qwen"),
        "xai": ("xAI", "xAI"),
        "allam": ("علّام", "ALLaM"),
    }
    provider_rows = [
        {
            "id": providers[key],
            "key": key,
            "name_ar": provider_names[key][0],
            "name_en": provider_names[key][1],
            "is_enabled": True,
        }
        for key in providers
    ]
    op.bulk_insert(sa.table("providers", sa.column("id"), sa.column("key"), sa.column("name_ar"), sa.column("name_en"), sa.column("is_enabled")), provider_rows)

    categories = [
        ("business", "Business", "أعمال", 1),
        ("startup", "Startup", "شركات ناشئة", 2),
        ("coding", "Coding", "برمجة", 3),
        ("research", "Research", "بحث", 4),
        ("marketing", "Marketing", "تسويق", 5),
        ("arabic_writing", "Arabic Writing", "كتابة عربية", 6),
        ("legal", "Legal", "قانوني", 7),
        ("general", "General", "عام", 8),
    ]
    op.bulk_insert(
        sa.table(
            "prompt_categories",
            sa.column("id"),
            sa.column("key"),
            sa.column("name_en"),
            sa.column("name_ar"),
            sa.column("sort_order"),
            sa.column("is_enabled"),
        ),
        [
            {"id": uuid.uuid4(), "key": k, "name_en": en, "name_ar": ar, "sort_order": order, "is_enabled": True}
            for k, en, ar, order in categories
        ],
    )

    model_defs = [
        ("openai", "gpt-4o", "GPT-4o", "GPT-4o", 1, False),
        ("openai", "gpt-4o-mini", "GPT-4o Mini", "GPT-4o Mini", 2, False),
        ("anthropic", "claude-sonnet-4-0", "Claude Sonnet 4", "Claude Sonnet 4", 3, False),
        ("google", "gemini-1.5-pro", "Gemini 1.5 Pro", "Gemini 1.5 Pro", 4, False),
        ("deepseek", "deepseek-chat", "DeepSeek Chat", "DeepSeek Chat", 5, False),
        ("qwen", "qwen-plus", "Qwen Plus", "Qwen Plus", 6, False),
        ("xai", "grok-beta", "Grok", "Grok", 7, False),
        ("allam", "allam", "علّام", "ALLaM", 8, True),
    ]
    op.bulk_insert(
        sa.table(
            "models",
            sa.column("id"),
            sa.column("provider_id"),
            sa.column("key"),
            sa.column("name_ar"),
            sa.column("name_en"),
            sa.column("sort_order"),
            sa.column("is_placeholder"),
            sa.column("is_enabled"),
        ),
        [
            {
                "id": uuid.uuid4(),
                "provider_id": providers[pk],
                "key": mk,
                "name_ar": nar,
                "name_en": ne,
                "sort_order": order,
                "is_placeholder": placeholder,
                "is_enabled": True,
            }
            for pk, mk, nar, ne, order, placeholder in model_defs
        ],
    )


def downgrade() -> None:
    op.drop_table("votes")
    op.drop_table("responses")
    op.drop_table("comparison_targets")
    op.drop_table("comparisons")
    op.drop_table("prompts")
    op.drop_table("models")
    op.drop_table("agents")
    op.drop_table("users")
    op.drop_table("prompt_categories")
    op.drop_table("providers")
