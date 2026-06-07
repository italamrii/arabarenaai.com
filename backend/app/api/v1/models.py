import uuid

from fastapi import APIRouter, Query

from app.core.dependencies import DbSession, RequestId
from app.core.exceptions import NotFoundAppError
from app.repositories.comparison_repo import ModelRepository
from app.schemas.common import Envelope, to_meta
from app.schemas.model import ModelListData
from app.services.mappers import model_out

router = APIRouter()


@router.get("")
def list_models(
    db: DbSession,
    request_id: RequestId,
    enabled_only: bool = Query(default=True),
    provider: str | None = Query(default=None),
) -> Envelope[ModelListData]:
    repo = ModelRepository(db)
    models = repo.list_models(enabled_only=enabled_only, provider_key=provider)
    return Envelope(
        data=ModelListData(models=[model_out(model) for model in models]),
        meta=to_meta(request_id, min_selection=2, max_selection=10),
    )


@router.get("/{model_id}")
def get_model(
    model_id: str,
    db: DbSession,
    request_id: RequestId,
) -> Envelope[dict]:
    repo = ModelRepository(db)
    try:
        parsed = uuid.UUID(model_id)
    except ValueError as exc:
        raise NotFoundAppError(
            message="النموذج غير موجود",
            message_en="Model not found",
        ) from exc
    model = repo.get_by_id(parsed)
    if model is None:
        raise NotFoundAppError(
            message="النموذج غير موجود",
            message_en="Model not found",
        )
    return Envelope(data=model_out(model), meta=to_meta(request_id))
