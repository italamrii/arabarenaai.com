import asyncio
import logging
import time
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.exceptions import (
    NotFoundAppError,
    UnprocessableAppError,
    ValidationAppError,
)
from app.domain.comparison import compute_comparison_status, validate_model_count
from app.models.comparison import Comparison
from app.models.model import AIModel
from app.providers.registry import ProviderRegistry
from app.repositories.comparison_repo import ComparisonRepository, ModelRepository
from app.observability.logging_config import log_event, log_exception_event
from app.observability.metrics import get_metrics
from app.providers.errors import ProviderCallError, ProviderErrorDetails, extract_provider_error
from app.services.category_service import CategoryService, ResolvedCategory

logger = logging.getLogger(__name__)


class ComparisonService:
    def __init__(
        self,
        db: Session,
        settings: Settings,
        provider_registry: ProviderRegistry,
    ) -> None:
        self.db = db
        self.settings = settings
        self.providers = provider_registry
        self.comparison_repo = ComparisonRepository(db)
        self.model_repo = ModelRepository(db)
        self.category_service = CategoryService(db, settings)

    async def create_comparison(
        self,
        *,
        prompt: str,
        category_mode: str,
        category_key: str | None,
        model_ids: list[str],
        session_id: str,
    ) -> Comparison:
        trimmed = prompt.strip()
        if not trimmed:
            raise ValidationAppError(
                message="النص مطلوب",
                message_en="Prompt is required",
            )
        if len(trimmed) > self.settings.max_prompt_length:
            raise ValidationAppError(
                message=f"النص يتجاوز {self.settings.max_prompt_length} حرفاً",
                message_en="Prompt too long",
            )

        try:
            validate_model_count(len(model_ids), self.settings)
        except ValueError as exc:
            raise ValidationAppError(
                message="يجب اختيار بين ٢ و ١٠ نماذج",
                message_en=str(exc),
                details=[{"field": "model_ids", "issue": "invalid_count"}],
            ) from exc

        parsed_ids = [self._parse_uuid(mid, "model_ids") for mid in model_ids]
        models = self.model_repo.get_by_ids(parsed_ids)
        if len(models) != len(parsed_ids):
            raise UnprocessableAppError(
                code="MODEL_NOT_AVAILABLE",
                message="أحد النماذج المحددة غير متوفر",
                message_en="One or more models not found",
            )

        for model in models:
            self._validate_model(model)

        resolved = await self.category_service.resolve_for_comparison(
            category_mode=category_mode,
            category_key=category_key,
            prompt=trimmed,
        )

        prompt_row = self.comparison_repo.get_or_create_prompt(trimmed)
        comparison = self.comparison_repo.create_comparison(
            prompt=prompt_row,
            category_id=resolved.category.id,
            session_id=session_id,
            category_source=resolved.source,
            category_confidence=resolved.confidence,
            model_ids=parsed_ids,
        )
        comparison.status = "running"
        self.db.commit()
        self.db.refresh(comparison)
        return comparison

    async def run_inference(self, comparison_id: uuid.UUID) -> None:
        db = self.db
        metrics = get_metrics()
        comparison_id_str = str(comparison_id)
        started = time.perf_counter()

        comparison = self.comparison_repo.get_by_id(comparison_id)
        if comparison is None:
            log_event(
                logger,
                "comparison.inference.not_found",
                level=logging.ERROR,
                comparison_id=comparison_id_str,
            )
            return

        metrics.record_comparison_started(comparison_id_str)
        log_event(
            logger,
            "comparison.inference.started",
            comparison_id=comparison_id_str,
            model_count=len(comparison.responses),
        )

        status = "failed"
        success_count = 0
        try:
            from app.models.prompt import Prompt

            prompt_row = db.get(Prompt, comparison.prompt_id)
            if prompt_row is None:
                log_event(
                    logger,
                    "comparison.inference.prompt_missing",
                    level=logging.ERROR,
                    comparison_id=comparison_id_str,
                )
                return

            models = self.model_repo.get_by_ids(
                [target.model_id for target in comparison.targets if target.model_id]
            )
            model_map = {model.id: model for model in models}

            tasks = []
            for response in comparison.responses:
                model = model_map.get(response.model_id) if response.model_id else None
                if model is None:
                    log_event(
                        logger,
                        "comparison.inference.model_missing",
                        level=logging.WARNING,
                        comparison_id=comparison_id_str,
                        response_id=str(response.id),
                        model_id=str(response.model_id),
                    )
                    continue
                tasks.append(self._infer_one(prompt_row.content, model, response.id))

            results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in results:
                if isinstance(result, Exception):
                    log_exception_event(
                        logger,
                        "comparison.inference.task_failed",
                        result,
                        comparison_id=comparison_id_str,
                    )
                    continue
                response_id, payload = result
                response = next(r for r in comparison.responses if r.id == response_id)
                if payload["status"] == "success":
                    success_count += 1
                self.comparison_repo.update_response(response, **payload)

            status = compute_comparison_status(success_count, len(comparison.responses))
            self.comparison_repo.set_comparison_status(comparison, status)
            db.commit()
        finally:
            duration_ms = int((time.perf_counter() - started) * 1000)
            metrics.record_comparison_finished(
                comparison_id=comparison_id_str,
                status=status,
                duration_ms=duration_ms,
                model_count=len(comparison.responses),
                success_count=success_count,
            )
            log_event(
                logger,
                "comparison.inference.completed",
                comparison_id=comparison_id_str,
                status=status,
                duration_ms=duration_ms,
                model_count=len(comparison.responses),
                success_count=success_count,
            )

    async def _infer_one(
        self,
        prompt: str,
        model: AIModel,
        response_id: uuid.UUID,
    ) -> tuple[uuid.UUID, dict]:
        provider_key = model.provider.key
        adapter = self.providers.get(provider_key)
        log_event(
            logger,
            "comparison.inference.model_starting",
            response_id=str(response_id),
            provider_key=provider_key,
            model_key=model.key,
            max_tokens=model.max_tokens,
            timeout_ms=model.timeout_ms,
            prompt_length=len(prompt),
            adapter_configured=bool(adapter and adapter.is_configured()),
            is_placeholder=model.is_placeholder,
        )
        if adapter is None or not adapter.is_configured() or model.is_placeholder:
            get_metrics().record_provider_failure(
                provider_key,
                error_type="ProviderUnavailable",
            )
            details = ProviderErrorDetails(
                error_code="provider_unavailable",
                error_message_debug="Provider adapter missing, not configured, or placeholder model",
                provider_key=provider_key,
                model_key=model.key,
                exception_class="ProviderUnavailable",
            )
            log_event(
                logger,
                "comparison.inference.provider_unavailable",
                level=logging.WARNING,
                response_id=str(response_id),
                **details.to_log_fields(),
            )
            return response_id, self._error_payload(details)

        try:
            result = await self.providers.run_inference(
                provider_key=provider_key,
                prompt=prompt,
                model_key=model.key,
                max_tokens=model.max_tokens,
                timeout_ms=model.timeout_ms,
            )
            return response_id, {
                "content": result.content,
                "response_time_ms": result.response_time_ms,
                "status": "success",
                "input_tokens": result.input_tokens,
                "output_tokens": result.output_tokens,
                "error_message": None,
                "content_structured": None,
            }
        except ProviderCallError as exc:
            log_exception_event(
                logger,
                "comparison.inference.provider_call_error",
                exc,
                response_id=str(response_id),
                **exc.details.to_log_fields(),
            )
            return response_id, self._error_payload(exc.details)
        except Exception as exc:
            details = extract_provider_error(
                exc,
                provider_key=provider_key,
                model_key=model.key,
            )
            log_exception_event(
                logger,
                "comparison.inference.model_execution_failed",
                exc,
                response_id=str(response_id),
                **details.to_log_fields(),
            )
            return response_id, self._error_payload(details)

    @staticmethod
    def _error_payload(details: ProviderErrorDetails) -> dict:
        log_event(
            logger,
            "provider.inference.error_persisted",
            level=logging.WARNING,
            **details.to_log_fields(),
        )
        return {
            "content": None,
            "response_time_ms": None,
            "status": "error",
            "error_message": "تعذر الحصول على رد من هذا النموذج",
            "content_structured": details.to_content_structured(),
        }

    def get_comparison(self, comparison_id: uuid.UUID) -> Comparison:
        comparison = self.comparison_repo.get_full(comparison_id)
        if comparison is None:
            raise NotFoundAppError(
                message="المقارنة غير موجودة",
                message_en="Comparison not found",
            )
        return comparison

    @staticmethod
    def _parse_uuid(value: str, field: str) -> uuid.UUID:
        try:
            return uuid.UUID(value)
        except ValueError as exc:
            raise ValidationAppError(
                message="معرف غير صالح",
                message_en=f"Invalid UUID in {field}",
            ) from exc

    @staticmethod
    def _validate_model(model: AIModel) -> None:
        if not model.is_enabled or not model.provider.is_enabled:
            raise UnprocessableAppError(
                code="MODEL_NOT_AVAILABLE",
                message="النموذج غير متاح",
                message_en="Model is disabled",
            )
        if model.is_placeholder:
            raise UnprocessableAppError(
                code="MODEL_NOT_AVAILABLE",
                message="هذا النموذج غير متاح حالياً",
                message_en="Placeholder model cannot be used",
            )
