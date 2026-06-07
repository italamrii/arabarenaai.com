from datetime import datetime

from app.models.category import PromptCategory
from app.models.comparison import Comparison
from app.models.model import AIModel
from app.models.vote import Vote
from app.schemas.common import CategoryOut, CategoryResolved, ModelOut, ProviderRef
from app.providers.errors import resolve_response_debug_fields
from app.schemas.comparison import (
    ComparisonCreatedOut,
    ComparisonOut,
    PromptRef,
    ResponseOut,
    TargetRef,
    VoteRef,
)


def category_out(category: PromptCategory) -> CategoryOut:
    return CategoryOut(
        id=str(category.id),
        key=category.key,
        name_ar=category.name_ar,
        name_en=category.name_en,
        sort_order=category.sort_order,
    )


def category_resolved(
    category: PromptCategory,
    *,
    source: str,
    confidence: float | None,
) -> CategoryResolved:
    return CategoryResolved(
        id=str(category.id),
        key=category.key,
        name_ar=category.name_ar,
        name_en=category.name_en,
        source=source,
        confidence=float(confidence) if confidence is not None else None,
    )


def model_out(model: AIModel) -> ModelOut:
    return ModelOut(
        id=str(model.id),
        key=model.key,
        name_ar=model.name_ar,
        name_en=model.name_en,
        provider=ProviderRef(key=model.provider.key, name_ar=model.provider.name_ar),
        is_placeholder=model.is_placeholder,
        max_tokens=model.max_tokens,
        status_ar="قريباً" if model.is_placeholder else None,
    )


def comparison_created_out(
    comparison: Comparison,
    category: PromptCategory,
    *,
    source: str,
    confidence: float | None,
    models: list[AIModel],
    char_count: int | None = None,
) -> ComparisonCreatedOut:
    model_map = {model.id: model for model in models}
    targets = []
    for target in sorted(comparison.targets, key=lambda t: t.position):
        if target.model_id and target.model_id in model_map:
            targets.append(TargetRef(model_id=str(target.model_id), position=target.position))

    return ComparisonCreatedOut(
        id=str(comparison.id),
        status=comparison.status,
        prompt=PromptRef(
            id=str(comparison.prompt_id),
            char_count=char_count,
        ),
        category=category_resolved(category, source=source, confidence=confidence),
        targets=targets,
        created_at=_iso(comparison.created_at),
    )


def comparison_out(
    comparison: Comparison,
    category: PromptCategory,
    *,
    source: str,
    confidence: float | None,
    models: list[AIModel],
    vote: Vote | None = None,
    circuit_breaker_states: dict[str, bool] | None = None,
) -> ComparisonOut:
    model_map = {model.id: model for model in models}
    from app.models.prompt import Prompt

    prompt_content: str | None = None
    if hasattr(comparison, "prompt") and comparison.prompt:  # type: ignore[attr-defined]
        prompt_content = comparison.prompt.content

    responses = []
    for response in comparison.responses:
        model = model_map.get(response.model_id) if response.model_id else None
        provider_key = model.provider.key if model else None
        circuit_open = bool(
            provider_key
            and circuit_breaker_states
            and circuit_breaker_states.get(provider_key, False)
        )
        debug = resolve_response_debug_fields(
            content_structured=response.content_structured,
            status=response.status,
            provider_key=provider_key,
            model_key=model.key if model else None,
            circuit_open=circuit_open,
        )
        responses.append(
            ResponseOut(
                id=str(response.id),
                model=model_out(model) if model else None,
                content=response.content,
                response_time_ms=response.response_time_ms,
                status=response.status,
                error_message_ar=response.error_message,
                error_code=debug["error_code"],
                error_message_debug=debug["error_message_debug"],
                provider_key=debug["provider_key"],
                model_key=debug["model_key"],
                exception_class=debug["exception_class"],
                status_code=debug["status_code"],
                request_id=debug["request_id"],
            )
        )

    return ComparisonOut(
        id=str(comparison.id),
        status=comparison.status,
        prompt=PromptRef(
            id=str(comparison.prompt_id),
            content=prompt_content,
        ),
        category=category_resolved(category, source=source, confidence=confidence),
        targets=[
            TargetRef(model_id=str(t.model_id), position=t.position)
            for t in sorted(comparison.targets, key=lambda x: x.position)
            if t.model_id
        ],
        responses=responses,
        vote=(
            VoteRef(
                response_id=str(vote.response_id),
                created_at=_iso(vote.created_at),
            )
            if vote
            else None
        ),
        created_at=_iso(comparison.created_at),
        completed_at=_iso(comparison.completed_at) if comparison.completed_at else None,
    )


def _iso(value: datetime) -> str:
    from datetime import UTC

    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
