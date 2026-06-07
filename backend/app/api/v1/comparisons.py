import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, status

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.core.dependencies import DbSession, OptionalSessionId, RequestId, rate_limit_comparisons
from app.providers.registry import get_provider_registry
from app.repositories.comparison_repo import CategoryRepository, ModelRepository
from app.schemas.common import Envelope, to_meta
from app.schemas.comparison import ComparisonCreateRequest, ComparisonCreatedOut, ComparisonOut
from app.services.comparison_service import ComparisonService
from app.services.mappers import comparison_created_out, comparison_out
from app.services.vote_service import VoteService

router = APIRouter()
logger = logging.getLogger(__name__)


async def _run_inference_task(comparison_id: uuid.UUID) -> None:
    from app.observability.logging_config import log_exception_event
    from app.observability.metrics import get_metrics

    db = SessionLocal()
    comparison_id_str = str(comparison_id)
    try:
        service = ComparisonService(db, get_settings(), get_provider_registry())
        await service.run_inference(comparison_id)
    except Exception as exc:
        get_metrics().record_comparison_background_error(comparison_id_str)
        log_exception_event(
            logger,
            "comparison.inference.background_failed",
            exc,
            comparison_id=comparison_id_str,
        )
    finally:
        db.close()


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def create_comparison(
    body: ComparisonCreateRequest,
    background_tasks: BackgroundTasks,
    db: DbSession,
    request_id: RequestId,
    session_id: Annotated[str, Depends(rate_limit_comparisons)],
) -> Envelope[ComparisonCreatedOut]:
    service = ComparisonService(db, get_settings(), get_provider_registry())
    comparison = await service.create_comparison(
        prompt=body.prompt,
        category_mode=body.category_mode,
        category_key=body.category_key,
        model_ids=body.model_ids,
        session_id=session_id,
    )
    category = CategoryRepository(db).get_by_id(comparison.category_id)
    models = ModelRepository(db).get_by_ids(
        [target.model_id for target in comparison.targets if target.model_id]
    )
    from app.models.prompt import Prompt

    prompt = db.get(Prompt, comparison.prompt_id)
    background_tasks.add_task(_run_inference_task, comparison.id)
    assert category is not None
    return Envelope(
        data=comparison_created_out(
            comparison,
            category,
            source=comparison.category_source,
            confidence=float(comparison.category_confidence)
            if comparison.category_confidence is not None
            else None,
            models=models,
            char_count=prompt.char_count if prompt else None,
        ),
        meta=to_meta(request_id),
    )


@router.get("/{comparison_id}", response_model=Envelope[ComparisonOut])
def get_comparison(
    comparison_id: str,
    db: DbSession,
    request_id: RequestId,
    session_id: OptionalSessionId,
) -> Envelope[ComparisonOut]:
    service = ComparisonService(db, get_settings(), get_provider_registry())
    try:
        parsed = uuid.UUID(comparison_id)
    except ValueError as exc:
        from app.core.exceptions import NotFoundAppError

        raise NotFoundAppError(
            message="المقارنة غير موجودة",
            message_en="Comparison not found",
        ) from exc

    comparison = service.get_comparison(parsed)
    category = CategoryRepository(db).get_by_id(comparison.category_id)
    models = ModelRepository(db).get_by_ids(
        [target.model_id for target in comparison.targets if target.model_id]
    )
    from app.models.prompt import Prompt

    prompt = db.get(Prompt, comparison.prompt_id)
    vote = VoteService(db).get_my_vote(parsed, session_id)
    assert category is not None

    registry = get_provider_registry()
    out = comparison_out(
        comparison,
        category,
        source=comparison.category_source,
        confidence=float(comparison.category_confidence)
        if comparison.category_confidence is not None
        else None,
        models=models,
        vote=vote,
        circuit_breaker_states=registry.circuit_breaker_states(),
    )
    if prompt:
        out.prompt.content = prompt.content
        out.prompt.char_count = prompt.char_count
    return Envelope(data=out, meta=to_meta(request_id))
