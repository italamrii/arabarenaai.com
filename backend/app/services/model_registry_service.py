from __future__ import annotations

import logging
import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.core.exceptions import ConflictAppError, NotFoundAppError, ValidationAppError
from app.models.model import AIModel
from app.models.provider import Provider
from app.observability.logging_config import log_event
from app.providers.registry import get_provider_registry
from app.schemas.model_registry import (
    ModelRegistryCreate,
    ModelRegistryItem,
    ModelRegistryListData,
    ModelRegistryProviderRef,
    ModelRegistryTestRequest,
    ModelRegistryTestResult,
    ModelRegistryUpdate,
)

logger = logging.getLogger(__name__)

TEST_PROMPTS = {
    "ar": "قل مرحباً بجملة قصيرة",
    "en": "Say hello in one short sentence",
}

class ModelRegistryService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.settings = get_settings()
        self.registry = get_provider_registry()

    def list_registry(self, *, provider_key: str | None = None) -> ModelRegistryListData:
        stmt = (
            select(AIModel)
            .join(Provider)
            .options(joinedload(AIModel.provider))
            .order_by(Provider.key, AIModel.sort_order, AIModel.name_ar)
        )
        if provider_key:
            stmt = stmt.where(Provider.key == provider_key)

        models = list(self.db.scalars(stmt).unique().all())
        providers = list(self.db.scalars(select(Provider).order_by(Provider.key)).all())

        return ModelRegistryListData(
            models=[self._to_item(model) for model in models],
            providers=[
                ModelRegistryProviderRef(
                    id=str(provider.id),
                    key=provider.key,
                    name_ar=provider.name_ar,
                    name_en=provider.name_en,
                    enabled=provider.is_enabled,
                )
                for provider in providers
            ],
        )

    def create_model(self, payload: ModelRegistryCreate) -> ModelRegistryItem:
        provider = self._resolve_provider(payload.provider_key)
        self._ensure_unique_key(payload.key)

        model = AIModel(
            provider_id=provider.id,
            key=payload.key,
            name_ar=payload.name_ar,
            name_en=payload.name_en,
            is_enabled=payload.is_enabled,
            is_placeholder=payload.is_placeholder,
            is_archived=False,
            supports_attachments=payload.supports_attachments,
            sort_order=payload.sort_order,
            max_tokens=payload.max_tokens,
            timeout_ms=payload.timeout_ms,
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)

        loaded = self._get_model_or_404(model.id)
        log_event(
            logger,
            "model_registry_created",
            admin_actor="admin",
            model_id=str(model.id),
            model_key=model.key,
            provider_key=provider.key,
        )
        return self._to_item(loaded)

    def update_model(self, model_id: uuid.UUID, payload: ModelRegistryUpdate) -> ModelRegistryItem:
        model = self._get_model_or_404(model_id)
        changes: dict[str, object] = {}

        if payload.key is not None and payload.key != model.key:
            self._ensure_unique_key(payload.key, exclude_id=model.id)
            changes["key"] = {"from": model.key, "to": payload.key}
            model.key = payload.key

        if payload.name_ar is not None:
            changes["name_ar"] = payload.name_ar
            model.name_ar = payload.name_ar

        if payload.name_en is not None:
            changes["name_en"] = payload.name_en
            model.name_en = payload.name_en

        if payload.provider_key is not None:
            provider = self._resolve_provider(payload.provider_key)
            changes["provider_key"] = provider.key
            model.provider_id = provider.id

        if payload.is_placeholder is not None:
            changes["is_placeholder"] = payload.is_placeholder
            model.is_placeholder = payload.is_placeholder

        if payload.supports_attachments is not None:
            changes["supports_attachments"] = payload.supports_attachments
            model.supports_attachments = payload.supports_attachments

        if payload.sort_order is not None:
            changes["sort_order"] = payload.sort_order
            model.sort_order = payload.sort_order

        if payload.max_tokens is not None:
            changes["max_tokens"] = payload.max_tokens
            model.max_tokens = payload.max_tokens

        if payload.timeout_ms is not None:
            changes["timeout_ms"] = payload.timeout_ms
            model.timeout_ms = payload.timeout_ms

        if payload.is_archived is not None:
            changes["is_archived"] = payload.is_archived
            model.is_archived = payload.is_archived
            if payload.is_archived:
                model.is_enabled = False

        if payload.is_enabled is not None:
            if not payload.is_enabled and not payload.confirm_disable_all:
                self._ensure_not_last_enabled_model(model, disabling=True)
            changes["is_enabled"] = payload.is_enabled
            model.is_enabled = payload.is_enabled

        self.db.commit()
        self.db.refresh(model)
        loaded = self._get_model_or_404(model.id)

        if changes:
            log_event(
                logger,
                "model_registry_updated",
                admin_actor="admin",
                model_id=str(model.id),
                model_key=model.key,
                provider_key=loaded.provider.key,
                changes=changes,
            )

        return self._to_item(loaded)

    async def test_model(
        self,
        model_id: uuid.UUID,
        payload: ModelRegistryTestRequest,
    ) -> ModelRegistryTestResult:
        model = self._get_model_or_404(model_id)
        provider_key = model.provider.key
        prompt = TEST_PROMPTS.get(payload.locale, TEST_PROMPTS["ar"])

        adapter = self.registry.get(provider_key)
        if adapter is None:
            log_event(
                logger,
                "model_registry_tested",
                admin_actor="admin",
                model_id=str(model.id),
                model_key=model.key,
                provider_key=provider_key,
                success=False,
                reason="adapter_not_registered",
            )
            return ModelRegistryTestResult(
                success=False,
                error_message="مزود التنفيذ غير مُهيّأ بعد",
                error_message_en="Provider adapter is not registered yet",
            )

        if not adapter.is_configured():
            log_event(
                logger,
                "model_registry_tested",
                admin_actor="admin",
                model_id=str(model.id),
                model_key=model.key,
                provider_key=provider_key,
                success=False,
                reason="adapter_not_configured",
            )
            return ModelRegistryTestResult(
                success=False,
                error_message="مفتاح API غير مُعدّ في متغيرات البيئة",
                error_message_en="API key is not configured in environment variables",
            )

        max_tokens = min(model.max_tokens, self.settings.provider_max_tokens)
        try:
            result = await self.registry.run_inference(
                provider_key=provider_key,
                prompt=prompt,
                model_key=model.key,
                max_tokens=max_tokens,
                timeout_ms=model.timeout_ms,
                attachment=None,
            )
            preview = (result.content or "").strip()
            if len(preview) > 280:
                preview = preview[:277] + "..."

            log_event(
                logger,
                "model_registry_tested",
                admin_actor="admin",
                model_id=str(model.id),
                model_key=model.key,
                provider_key=provider_key,
                success=True,
                response_time_ms=result.response_time_ms,
            )
            return ModelRegistryTestResult(
                success=True,
                response_preview=preview,
                response_time_ms=result.response_time_ms,
            )
        except Exception as exc:
            message_en = str(exc)
            message_ar = "فشل اختبار النموذج"
            log_event(
                logger,
                "model_registry_tested",
                admin_actor="admin",
                model_id=str(model.id),
                model_key=model.key,
                provider_key=provider_key,
                success=False,
                error_type=type(exc).__name__,
                error_message_en=message_en[:500],
            )
            return ModelRegistryTestResult(
                success=False,
                error_message=message_ar,
                error_message_en=message_en[:500],
            )

    def _to_item(self, model: AIModel) -> ModelRegistryItem:
        adapter = self.registry.get(model.provider.key)
        return ModelRegistryItem(
            id=str(model.id),
            key=model.key,
            name_ar=model.name_ar,
            name_en=model.name_en,
            provider_id=str(model.provider_id),
            provider_key=model.provider.key,
            provider_name_ar=model.provider.name_ar,
            is_enabled=model.is_enabled,
            is_placeholder=model.is_placeholder,
            is_archived=model.is_archived,
            supports_attachments=model.supports_attachments,
            sort_order=model.sort_order,
            max_tokens=model.max_tokens,
            timeout_ms=model.timeout_ms,
            adapter_configured=bool(adapter and adapter.is_configured()),
        )

    def _get_model_or_404(self, model_id: uuid.UUID) -> AIModel:
        model = self.db.scalar(
            select(AIModel)
            .join(Provider)
            .options(joinedload(AIModel.provider))
            .where(AIModel.id == model_id)
        )
        if model is None:
            raise NotFoundAppError(
                message="النموذج غير موجود",
                message_en="Model not found",
            )
        return model

    def _resolve_provider(self, provider_key: str) -> Provider:
        provider = self.db.scalar(select(Provider).where(Provider.key == provider_key))
        if provider is None:
            raise NotFoundAppError(
                message="المزود غير موجود",
                message_en="Provider not found",
            )
        return provider

    def _ensure_unique_key(self, key: str, *, exclude_id: uuid.UUID | None = None) -> None:
        stmt = select(AIModel).where(AIModel.key == key)
        if exclude_id is not None:
            stmt = stmt.where(AIModel.id != exclude_id)
        existing = self.db.scalar(stmt)
        if existing is not None:
            raise ConflictAppError(
                code="MODEL_KEY_EXISTS",
                message="مفتاح النموذج مستخدم مسبقاً",
                message_en="Model key already exists",
            )

    def _count_selectable_enabled(self) -> int:
        count = self.db.scalar(
            select(func.count())
            .select_from(AIModel)
            .where(
                AIModel.is_enabled.is_(True),
                AIModel.is_placeholder.is_(False),
                AIModel.is_archived.is_(False),
            )
        )
        return int(count or 0)

    def _ensure_not_last_enabled_model(self, model: AIModel, *, disabling: bool) -> None:
        if not disabling:
            return
        if model.is_placeholder or model.is_archived or not model.is_enabled:
            return
        if self._count_selectable_enabled() <= 1:
            raise ValidationAppError(
                message="لا يمكن تعطيل آخر نموذج قابل للاختيار دون تأكيد",
                message_en="Cannot disable the last selectable model without confirmation",
            )
