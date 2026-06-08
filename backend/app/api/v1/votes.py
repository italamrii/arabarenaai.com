import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.dependencies import DbSession, OptionalSessionId, RequestId, rate_limit_votes
from app.core.maintenance import require_platform_available
from app.core.exceptions import NotFoundAppError
from app.schemas.common import Envelope, to_meta
from app.schemas.vote import VoteCreateRequest, VoteMeData, VoteOut
from app.services.vote_service import VoteService

router = APIRouter()


@router.post(
    "/comparisons/{comparison_id}/votes",
    status_code=status.HTTP_201_CREATED,
)
def cast_vote(
    comparison_id: str,
    body: VoteCreateRequest,
    db: DbSession,
    request_id: RequestId,
    session_id: Annotated[str, Depends(rate_limit_votes)],
    _platform: Annotated[None, Depends(require_platform_available)],
) -> Envelope[VoteOut]:
    service = VoteService(db)
    try:
        parsed_comparison = uuid.UUID(comparison_id)
        parsed_response = uuid.UUID(body.response_id)
    except ValueError as exc:
        raise NotFoundAppError(
            message="المقارنة غير موجودة",
            message_en="Comparison not found",
        ) from exc

    vote = service.cast_vote(
        comparison_id=parsed_comparison,
        response_id=parsed_response,
        session_id=session_id,
    )
    return Envelope(
        data=VoteOut(
            id=str(vote.id),
            comparison_id=str(vote.comparison_id),
            response_id=str(vote.response_id),
            created_at=vote.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        ),
        meta=to_meta(request_id),
    )


@router.get("/comparisons/{comparison_id}/votes/me")
def get_my_vote(
    comparison_id: str,
    db: DbSession,
    request_id: RequestId,
    session_id: OptionalSessionId,
) -> Envelope[VoteMeData]:
    service = VoteService(db)
    try:
        parsed = uuid.UUID(comparison_id)
    except ValueError as exc:
        raise NotFoundAppError(
            message="المقارنة غير موجودة",
            message_en="Comparison not found",
        ) from exc

    vote = service.get_my_vote(parsed, session_id)
    vote_out = None
    if vote:
        vote_out = VoteOut(
            id=str(vote.id),
            comparison_id=str(vote.comparison_id),
            response_id=str(vote.response_id),
            created_at=vote.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        )
    return Envelope(
        data=VoteMeData(has_voted=vote is not None, vote=vote_out),
        meta=to_meta(request_id),
    )
