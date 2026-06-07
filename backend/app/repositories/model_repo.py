import uuid

from sqlalchemy.orm import Session

from app.repositories.comparison_repo import ModelRepository


class ModelRepoAccessor:
    @staticmethod
    def create(db: Session) -> ModelRepository:
        return ModelRepository(db)
