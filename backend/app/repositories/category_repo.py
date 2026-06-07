from sqlalchemy.orm import Session

from app.repositories.comparison_repo import CategoryRepository


class CategoryRepoAccessor:
    @staticmethod
    def create(db: Session) -> CategoryRepository:
        return CategoryRepository(db)
