from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.config import get_settings
from app.core.dependencies import DbSession, RequestId, rate_limit_category_detect
from app.schemas.category import CategoryDetectData, CategoryDetectRequest, CategoryListData
from app.schemas.common import CategoryOut, Envelope, to_meta
from app.services.category_service import CategoryService
from app.services.mappers import category_out

router = APIRouter()
settings = get_settings()


@router.get("")
def list_categories(db: DbSession, request_id: RequestId) -> Envelope[CategoryListData]:
    service = CategoryService(db, settings)
    categories = [
        category_out(category)
        for category in service.list_categories()
    ]
    return Envelope(
        data=CategoryListData(categories=categories),
        meta=to_meta(
            request_id,
            default_key="general",
            supports_auto_detect=True,
        ),
    )


@router.post("/detect")
async def detect_category(
    body: CategoryDetectRequest,
    db: DbSession,
    request_id: RequestId,
    _session: Annotated[str, Depends(rate_limit_category_detect)],
) -> Envelope[CategoryDetectData]:
    service = CategoryService(db, settings)
    resolved = await service.detect_category(body.prompt)
    threshold = settings.category_confidence_threshold
    fallback_used = (
        resolved.confidence is not None and resolved.confidence < threshold
    ) or resolved.category.key == "general"
    return Envelope(
        data=CategoryDetectData(
            suggested_category=category_out(resolved.category),
            confidence=float(resolved.confidence or 0.0),
            fallback_used=fallback_used,
        ),
        meta=to_meta(request_id),
    )
