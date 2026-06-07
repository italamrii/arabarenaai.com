import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictAppError, NotFoundAppError, UnprocessableAppError
from app.domain.voting import can_cast_vote
from app.models.vote import Vote
from app.repositories.comparison_repo import ComparisonRepository
from app.repositories.vote_repo import VoteRepository


class VoteService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.vote_repo = VoteRepository(db)
        self.comparison_repo = ComparisonRepository(db)

    def cast_vote(
        self,
        *,
        comparison_id: uuid.UUID,
        response_id: uuid.UUID,
        session_id: str,
    ) -> Vote:
        comparison = self.comparison_repo.get_full(comparison_id)
        if comparison is None:
            raise NotFoundAppError(
                message="المقارنة غير موجودة",
                message_en="Comparison not found",
            )

        existing = self.vote_repo.get_by_comparison_and_session(comparison_id, session_id)
        response = self.vote_repo.get_response(response_id)

        if response is None or response.comparison_id != comparison_id:
            raise NotFoundAppError(
                message="الرد غير موجود في هذه المقارنة",
                message_en="Response not found for comparison",
            )

        try:
            can_cast_vote(
                comparison.status,
                response.status,
                existing is not None,
            )
        except ValueError as exc:
            message = str(exc)
            if "already cast" in message:
                raise ConflictAppError(
                    code="VOTE_ALREADY_CAST",
                    message="لقد قمت بالتصويت مسبقاً على هذه المقارنة",
                    message_en="Vote already cast for this comparison",
                ) from exc
            raise UnprocessableAppError(
                code="COMPARISON_NOT_READY",
                message="المقارنة غير جاهزة للتصويت",
                message_en=message,
            ) from exc

        vote = self.vote_repo.create(
            comparison_id=comparison_id,
            response_id=response_id,
            session_id=session_id,
        )
        self.db.commit()
        self.db.refresh(vote)
        return vote

    def get_my_vote(
        self,
        comparison_id: uuid.UUID,
        session_id: str | None,
    ) -> Vote | None:
        if not session_id:
            return None
        return self.vote_repo.get_by_comparison_and_session(comparison_id, session_id)
