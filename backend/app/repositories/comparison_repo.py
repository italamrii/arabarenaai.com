import hashlib
import unicodedata
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.category import PromptCategory
from app.models.comparison import Comparison, ComparisonTarget
from app.models.model import AIModel
from app.models.prompt import Prompt
from app.models.provider import Provider
from app.models.response import ModelResponse


def normalize_prompt(content: str) -> str:
    return unicodedata.normalize("NFC", content.strip())


def hash_prompt(content: str) -> str:
    return hashlib.sha256(normalize_prompt(content).encode("utf-8")).hexdigest()


class CategoryRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_enabled(self) -> list[PromptCategory]:
        stmt = (
            select(PromptCategory)
            .where(PromptCategory.is_enabled.is_(True))
            .order_by(PromptCategory.sort_order)
        )
        return list(self.db.scalars(stmt).all())

    def get_by_key(self, key: str) -> PromptCategory | None:
        return self.db.scalar(select(PromptCategory).where(PromptCategory.key == key))

    def get_by_id(self, category_id: uuid.UUID) -> PromptCategory | None:
        return self.db.get(PromptCategory, category_id)


class ModelRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_models(
        self,
        *,
        enabled_only: bool = True,
        provider_key: str | None = None,
    ) -> list[AIModel]:
        stmt = select(AIModel).join(Provider).options(joinedload(AIModel.provider))
        stmt = stmt.where(AIModel.is_archived.is_(False))
        if enabled_only:
            stmt = stmt.where(AIModel.is_enabled.is_(True), Provider.is_enabled.is_(True))
        else:
            stmt = stmt.where(Provider.is_enabled.is_(True))
        if provider_key:
            stmt = stmt.where(Provider.key == provider_key)
        stmt = stmt.order_by(AIModel.sort_order, AIModel.name_ar)
        return list(self.db.scalars(stmt).unique().all())

    def get_by_ids(self, model_ids: list[uuid.UUID]) -> list[AIModel]:
        if not model_ids:
            return []
        stmt = (
            select(AIModel)
            .join(Provider)
            .options(joinedload(AIModel.provider))
            .where(AIModel.id.in_(model_ids))
        )
        return list(self.db.scalars(stmt).unique().all())

    def get_by_id(self, model_id: uuid.UUID) -> AIModel | None:
        stmt = (
            select(AIModel)
            .join(Provider)
            .options(joinedload(AIModel.provider))
            .where(AIModel.id == model_id)
        )
        return self.db.scalar(stmt)


class ComparisonRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_or_create_prompt(self, content: str) -> Prompt:
        normalized = normalize_prompt(content)
        content_hash = hash_prompt(normalized)
        existing = self.db.scalar(select(Prompt).where(Prompt.content_hash == content_hash))
        if existing:
            return existing
        prompt = Prompt(content=normalized, content_hash=content_hash, char_count=len(normalized))
        self.db.add(prompt)
        self.db.flush()
        return prompt

    def create_comparison(
        self,
        *,
        prompt: Prompt,
        category_id: uuid.UUID,
        session_id: str,
        category_source: str,
        category_confidence: float | None,
        model_ids: list[uuid.UUID],
        upload_id: uuid.UUID | None = None,
    ) -> Comparison:
        comparison = Comparison(
            prompt_id=prompt.id,
            category_id=category_id,
            session_id=session_id,
            category_source=category_source,
            category_confidence=category_confidence,
            status="pending",
            target_count=len(model_ids),
            upload_id=upload_id,
        )
        self.db.add(comparison)
        self.db.flush()

        for position, model_id in enumerate(model_ids):
            self.db.add(
                ComparisonTarget(
                    comparison_id=comparison.id,
                    model_id=model_id,
                    position=position,
                )
            )
            self.db.add(
                ModelResponse(
                    comparison_id=comparison.id,
                    model_id=model_id,
                    status="pending",
                )
            )

        self.db.flush()
        return comparison

    def get_by_id(self, comparison_id: uuid.UUID) -> Comparison | None:
        stmt = (
            select(Comparison)
            .options(
                joinedload(Comparison.targets),
                joinedload(Comparison.responses).joinedload(ModelResponse.votes),
            )
            .where(Comparison.id == comparison_id)
        )
        return self.db.scalar(stmt)

    def get_full(self, comparison_id: uuid.UUID) -> Comparison | None:
        stmt = (
            select(Comparison)
            .options(
                joinedload(Comparison.targets),
                joinedload(Comparison.responses),
                joinedload(Comparison.votes),
            )
            .where(Comparison.id == comparison_id)
        )
        return self.db.scalar(stmt)

    def update_response(
        self,
        response: ModelResponse,
        *,
        content: str | None,
        response_time_ms: int | None,
        status: str,
        error_message: str | None = None,
        input_tokens: int | None = None,
        output_tokens: int | None = None,
        content_structured: dict | None = None,
    ) -> None:
        from datetime import UTC, datetime

        response.content = content
        response.response_time_ms = response_time_ms
        response.status = status
        response.error_message = error_message
        response.input_tokens = input_tokens
        response.output_tokens = output_tokens
        response.content_structured = content_structured
        response.completed_at = datetime.now(UTC)
        self.db.add(response)

    def set_comparison_status(
        self,
        comparison: Comparison,
        status: str,
    ) -> None:
        from datetime import UTC, datetime

        comparison.status = status
        if status in {"completed", "partial", "failed"}:
            comparison.completed_at = datetime.now(UTC)
        self.db.add(comparison)
