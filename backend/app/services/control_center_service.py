from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.model import AIModel
from app.models.provider import Provider
from app.observability.logging_config import log_event
from app.schemas.control_center import (
    ModelControlItem,
    ModelControlsData,
    ProviderControlItem,
    ProviderControlsData,
)

logger = logging.getLogger(__name__)

CONTROLLED_PROVIDER_KEYS = (
    "openai",
    "anthropic",
    "google",
    "deepseek",
    "xai",
)


class ControlCenterService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_provider_controls(self) -> ProviderControlsData:
        rows = self.db.scalars(
            select(Provider)
            .where(Provider.key.in_(CONTROLLED_PROVIDER_KEYS))
            .order_by(Provider.key)
        ).all()
        by_key = {row.key: row for row in rows}
        providers = [
            ProviderControlItem(
                key=key,
                name_ar=by_key[key].name_ar if key in by_key else key,
                name_en=by_key[key].name_en if key in by_key else None,
                enabled=by_key[key].is_enabled if key in by_key else False,
            )
            for key in CONTROLLED_PROVIDER_KEYS
            if key in by_key
        ]
        return ProviderControlsData(providers=providers)

    def update_provider_control(self, *, provider_key: str, enabled: bool) -> ProviderControlItem:
        provider = self.db.scalar(select(Provider).where(Provider.key == provider_key))
        if provider is None or provider_key not in CONTROLLED_PROVIDER_KEYS:
            from app.core.exceptions import NotFoundAppError

            raise NotFoundAppError(
                message="المزود غير موجود",
                message_en="Provider not found",
            )

        previous = provider.is_enabled
        provider.is_enabled = enabled
        self.db.commit()
        self.db.refresh(provider)

        if previous != enabled:
            log_event(
                logger,
                "provider_enabled" if enabled else "provider_disabled",
                admin_actor="admin",
                provider_key=provider_key,
                previous_enabled=previous,
                enabled=enabled,
            )

        return ProviderControlItem(
            key=provider.key,
            name_ar=provider.name_ar,
            name_en=provider.name_en,
            enabled=provider.is_enabled,
        )

    def get_model_controls(self) -> ModelControlsData:
        rows = list(
            self.db.scalars(
                select(AIModel)
                .join(Provider)
                .options(joinedload(AIModel.provider))
                .where(
                    Provider.key.in_(CONTROLLED_PROVIDER_KEYS),
                    AIModel.is_placeholder.is_(False),
                )
                .order_by(Provider.key, AIModel.sort_order, AIModel.name_ar)
            ).unique().all()
        )
        return ModelControlsData(
            models=[
                ModelControlItem(
                    id=str(model.id),
                    key=model.key,
                    name_ar=model.name_ar,
                    name_en=model.name_en,
                    provider_key=model.provider.key,
                    enabled=model.is_enabled,
                )
                for model in rows
            ]
        )

    def update_model_control(self, *, model_key: str, enabled: bool) -> ModelControlItem:
        model = self.db.scalar(
            select(AIModel)
            .join(Provider)
            .options(joinedload(AIModel.provider))
            .where(
                AIModel.key == model_key,
                AIModel.is_placeholder.is_(False),
                Provider.key.in_(CONTROLLED_PROVIDER_KEYS),
            )
        )
        if model is None:
            from app.core.exceptions import NotFoundAppError

            raise NotFoundAppError(
                message="النموذج غير موجود",
                message_en="Model not found",
            )

        previous = model.is_enabled
        model.is_enabled = enabled
        self.db.commit()
        self.db.refresh(model)

        if previous != enabled:
            log_event(
                logger,
                "model_enabled" if enabled else "model_disabled",
                admin_actor="admin",
                model_key=model_key,
                provider_key=model.provider.key,
                previous_enabled=previous,
                enabled=enabled,
            )

        return ModelControlItem(
            id=str(model.id),
            key=model.key,
            name_ar=model.name_ar,
            name_en=model.name_en,
            provider_key=model.provider.key,
            enabled=model.is_enabled,
        )
