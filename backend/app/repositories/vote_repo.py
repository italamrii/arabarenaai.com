import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.category import PromptCategory
from app.models.comparison import Comparison
from app.models.model import AIModel
from app.models.provider import Provider
from app.models.response import ModelResponse
from app.models.vote import Vote


class VoteRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_comparison_and_session(
        self,
        comparison_id: uuid.UUID,
        session_id: str,
    ) -> Vote | None:
        stmt = select(Vote).where(
            Vote.comparison_id == comparison_id,
            Vote.session_id == session_id,
        )
        return self.db.scalar(stmt)

    def create(
        self,
        *,
        comparison_id: uuid.UUID,
        response_id: uuid.UUID,
        session_id: str,
    ) -> Vote:
        vote = Vote(
            comparison_id=comparison_id,
            response_id=response_id,
            session_id=session_id,
        )
        self.db.add(vote)
        self.db.flush()
        return vote

    def get_response(self, response_id: uuid.UUID) -> ModelResponse | None:
        return self.db.get(ModelResponse, response_id)


class AnalyticsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def preference_counts(
        self,
        *,
        category_id: uuid.UUID | None = None,
    ) -> list[tuple[AIModel, int]]:
        stmt = (
            select(AIModel, func.count(Vote.id))
            .join(ModelResponse, ModelResponse.model_id == AIModel.id)
            .join(Vote, Vote.response_id == ModelResponse.id)
            .join(Comparison, Comparison.id == Vote.comparison_id)
            .join(Provider, Provider.id == AIModel.provider_id)
            .where(ModelResponse.status == "success")
        )
        if category_id is not None:
            stmt = stmt.where(Comparison.category_id == category_id)

        stmt = stmt.group_by(AIModel.id, Provider.id).order_by(AIModel.name_ar)
        rows = self.db.execute(stmt).all()
        return [(row[0], int(row[1])) for row in rows]

    def total_votes(self, *, category_id: uuid.UUID | None = None) -> int:
        stmt = select(func.count(Vote.id)).join(
            Comparison, Comparison.id == Vote.comparison_id
        )
        if category_id is not None:
            stmt = stmt.where(Comparison.category_id == category_id)
        return int(self.db.scalar(stmt) or 0)

    def list_categories(self) -> list[PromptCategory]:
        stmt = (
            select(PromptCategory)
            .where(PromptCategory.is_enabled.is_(True))
            .order_by(PromptCategory.sort_order)
        )
        return list(self.db.scalars(stmt).all())

    def get_model(self, model_id: uuid.UUID) -> AIModel | None:
        stmt = (
            select(AIModel)
            .join(Provider)
            .options(joinedload(AIModel.provider))
            .where(AIModel.id == model_id)
        )
        return self.db.scalar(stmt)
