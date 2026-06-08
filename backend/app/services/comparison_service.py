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
from app.domain.comparison import compute_comparison_status
from app.models.comparison import Comparison
from app.models.model import AIModel
from app.providers.registry import ProviderRegistry
from app.repositories.comparison_repo import ComparisonRepository, ModelRepository
from app.observability.logging_config import log_event, log_exception_event
from app.observability.metrics import get_metrics
from app.providers.errors import ProviderCallError, ProviderErrorDetails, extract_provider_error
from app.services.attachment_resolver import IMAGE_UNSUPPORTED_AR, resolve_for_provider

PROVIDER_DISABLED_AR = "المزود معطل مؤقتاً"
MODEL_DISABLED_AR = "النموذج معطل مؤقتاً"
from app.services.category_service import CategoryService, ResolvedCategory
from app.services.upload_service import UploadService

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

    def _enforce_spending_limits(
        self,
        *,
        prompt: str,
        model_count: int,
        has_attachment: bool = False,
    ) -> str:
        """Reject comparisons that exceed env-configured spending limits."""
        trimmed = prompt.strip()
        if not trimmed and not has_attachment:
            raise ValidationAppError(
                message="النص أو المرفق مطلوب",
                message_en="Prompt or attachment is required",
            )

        max_chars = self.settings.max_prompt_chars
        if trimmed and len(trimmed) > max_chars:
            raise ValidationAppError(
                message=f"النص يتجاوز {max_chars} حرفاً",
                message_en="Prompt too long",
                details=[{"field": "prompt", "issue": "too_long", "max": max_chars}],
            )

        min_models = self.settings.min_models_per_comparison
        max_models = self.settings.max_models_per_comparison
        if model_count < min_models:
            raise ValidationAppError(
                message=f"يجب اختيار {min_models} نماذج على الأقل",
                message_en=f"At least {min_models} models required",
                details=[{"field": "model_ids", "issue": "too_few", "min": min_models}],
            )
        if model_count > max_models:
            raise ValidationAppError(
                message=f"الحد الأقصى {max_models} نماذج لكل مقارنة",
                message_en=f"At most {max_models} models per comparison",
                details=[{"field": "model_ids", "issue": "too_many", "max": max_models}],
            )

        return trimmed

    def _effective_max_tokens(self, model: AIModel) -> int:
        return min(model.max_tokens, self.settings.provider_max_tokens)

    async def create_comparison(
        self,
        *,
        prompt: str,
        category_mode: str,
        category_key: str | None,
        model_ids: list[str],
        session_id: str,
        attachment_id: str | None = None,
    ) -> Comparison:
        upload_uuid: uuid.UUID | None = None
        if attachment_id:
            upload_uuid = self._parse_uuid(attachment_id, "attachment_id")
            UploadService(self.db, self.settings).get_upload(upload_uuid, session_id=session_id)

        trimmed = self._enforce_spending_limits(
            prompt=prompt,
            model_count=len(model_ids),
            has_attachment=upload_uuid is not None,
        )

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

        category_prompt = trimmed or "تحليل المرفق المرفوع"
        resolved = await self.category_service.resolve_for_comparison(
            category_mode=category_mode,
            category_key=category_key,
            prompt=category_prompt,
        )

        stored_prompt = trimmed or (f"[attachment:{upload_uuid}]" if upload_uuid else "")
        prompt_row = self.comparison_repo.get_or_create_prompt(stored_prompt)
        comparison = self.comparison_repo.create_comparison(
            prompt=prompt_row,
            category_id=resolved.category.id,
            session_id=session_id,
            category_source=resolved.source,
            category_confidence=resolved.confidence,
            model_ids=parsed_ids,
            upload_id=upload_uuid,
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

            attachment_input = None
            if comparison.upload_id:
                attachment_input = UploadService(db, self.settings).load_attachment(
                    comparison.upload_id
                )

            try:
                self._enforce_spending_limits(
                    prompt=prompt_row.content,
                    model_count=len(comparison.targets),
                    has_attachment=attachment_input is not None,
                )
            except ValidationAppError as exc:
                log_event(
                    logger,
                    "comparison.inference.spending_limit_rejected",
                    level=logging.WARNING,
                    comparison_id=comparison_id_str,
                    error_code=exc.code,
                    message_ar=exc.message,
                )
                self.comparison_repo.set_comparison_status(comparison, "failed")
                db.commit()
                status = "failed"
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
                tasks.append(
                    self._infer_one(prompt_row.content, model, response.id, attachment_input)
                )

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
        attachment_input,
    ) -> tuple[uuid.UUID, dict]:
        provider_key = model.provider.key
        adapter = self.providers.get(provider_key)
        capped_max_tokens = self._effective_max_tokens(model)
        log_event(
            logger,
            "comparison.inference.model_starting",
            response_id=str(response_id),
            provider_key=provider_key,
            model_key=model.key,
            max_tokens=capped_max_tokens,
            model_max_tokens=model.max_tokens,
            provider_max_tokens_cap=self.settings.provider_max_tokens,
            timeout_ms=model.timeout_ms,
            prompt_length=len(prompt),
            adapter_configured=bool(adapter and adapter.is_configured()),
            is_placeholder=model.is_placeholder,
        )
        if not model.provider.is_enabled:
            details = ProviderErrorDetails(
                error_code="provider_disabled",
                error_message_debug="Provider temporarily disabled",
                provider_key=provider_key,
                model_key=model.key,
                exception_class="ProviderDisabled",
            )
            payload = self._error_payload(details)
            payload["error_message"] = PROVIDER_DISABLED_AR
            return response_id, payload

        if not model.is_enabled:
            details = ProviderErrorDetails(
                error_code="model_disabled",
                error_message_debug="Model temporarily disabled",
                provider_key=provider_key,
                model_key=model.key,
                exception_class="ModelDisabled",
            )
            payload = self._error_payload(details)
            payload["error_message"] = MODEL_DISABLED_AR
            return response_id, payload

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

        resolved = resolve_for_provider(
            prompt=prompt,
            attachment=attachment_input,
            provider_key=provider_key,
        )
        if resolved.unsupported_image:
            details = ProviderErrorDetails(
                error_code="attachment_unsupported",
                error_message_debug="Model does not support image attachments",
                provider_key=provider_key,
                model_key=model.key,
                exception_class="AttachmentUnsupported",
            )
            payload = self._error_payload(details)
            payload["error_message"] = IMAGE_UNSUPPORTED_AR
            return response_id, payload

        try:
            result = await self.providers.run_inference(
                provider_key=provider_key,
                prompt=resolved.prompt,
                model_key=model.key,
                max_tokens=capped_max_tokens,
                timeout_ms=model.timeout_ms,
                attachment=resolved.attachment,
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
        if not model.provider.is_enabled:
            raise UnprocessableAppError(
                code="PROVIDER_DISABLED",
                message=PROVIDER_DISABLED_AR,
                message_en="Provider temporarily disabled",
            )
        if not model.is_enabled:
            raise UnprocessableAppError(
                code="MODEL_DISABLED",
                message=MODEL_DISABLED_AR,
                message_en="Model temporarily disabled",
            )
        if model.is_placeholder:
            raise UnprocessableAppError(
                code="MODEL_NOT_AVAILABLE",
                message="هذا النموذج غير متاح حالياً",
                message_en="Placeholder model cannot be used",
            )
