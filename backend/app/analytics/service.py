import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundAppError, ValidationAppError
from app.models.category import PromptCategory
from app.models.model import AIModel
from app.repositories.comparison_repo import CategoryRepository
from app.repositories.vote_repo import AnalyticsRepository
from app.analytics.serializers import build_preference_items
from app.schemas.analytics import (
    CategorySummaryItem,
    ModelPreferenceData,
    PreferencesData,
    PreferencesSummaryData,
)
from app.schemas.common import CategoryOut


DISCLAIMER_OVERALL_AR = "هذه النسب تعكس تفضيلات المجتمع وليست تقييماً رسمياً للنماذج"
DISCLAIMER_CATEGORY_AR = "هذه النسب تعكس تفضيلات المجتمع في هذه الفئة فقط"
DISCLAIMER_EN = "These figures reflect community preferences, not official model evaluations"


class AnalyticsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.analytics_repo = AnalyticsRepository(db)
        self.category_repo = CategoryRepository(db)

    def get_preferences(
        self,
        *,
        category_key: str | None = None,
        category_id: str | None = None,
        period: str = "all_time",
    ) -> PreferencesData:
        category = self._resolve_category(category_key, category_id)
        rows = self.analytics_repo.preference_counts(
            category_id=category.id if category else None
        )
        preferences, total_votes = build_preference_items(rows)

        if category:
            return PreferencesData(
                scope="category",
                category=self._category_out(category),
                disclaimer_ar=DISCLAIMER_CATEGORY_AR,
                disclaimer_en=DISCLAIMER_EN,
                period=period,
                total_votes=total_votes,
                preferences=preferences,
            )

        return PreferencesData(
            scope="overall",
            category=None,
            disclaimer_ar=DISCLAIMER_OVERALL_AR,
            disclaimer_en=DISCLAIMER_EN,
            period=period,
            total_votes=total_votes,
            preferences=preferences,
        )

    def get_summary(self, *, period: str = "all_time") -> PreferencesSummaryData:
        overall = self.get_preferences(period=period)
        by_category: list[CategorySummaryItem] = []
        for category in self.analytics_repo.list_categories():
            rows = self.analytics_repo.preference_counts(category_id=category.id)
            preferences, total_votes = build_preference_items(rows)
            by_category.append(
                CategorySummaryItem(
                    category=self._category_out(category),
                    total_votes=total_votes,
                    preferences=preferences,
                )
            )
        return PreferencesSummaryData(period=period, overall=overall, by_category=by_category)

    def get_model_preference(
        self,
        model_id: uuid.UUID,
        *,
        category_key: str | None = None,
        period: str = "all_time",
    ) -> ModelPreferenceData:
        model = self.analytics_repo.get_model(model_id)
        if model is None:
            raise NotFoundAppError(
                message="النموذج غير موجود",
                message_en="Model not found",
            )

        category = self._resolve_category(category_key, None)
        rows = self.analytics_repo.preference_counts(
            category_id=category.id if category else None
        )
        _, total_votes = build_preference_items(rows)
        model_votes = next((count for m, count in rows if m.id == model.id), 0)
        share = round(100.0 * model_votes / total_votes, 2) if total_votes else 0.0

        return ModelPreferenceData(
            model_id=str(model.id),
            name_ar=model.name_ar,
            scope="category" if category else "overall",
            category=self._category_out(category) if category else None,
            period=period,
            vote_count=model_votes,
            total_votes_in_period=total_votes,
            preference_share_pct=share,
            disclaimer_ar="هذه النسبة تعكس تفضيلات المجتمع خلال الفترة المحددة",
        )

    def _resolve_category(
        self,
        category_key: str | None,
        category_id: str | None,
    ) -> PromptCategory | None:
        if category_key and category_id:
            raise ValidationAppError(
                message="استخدم category_key أو category_id وليس كلاهما",
                message_en="Use category_key or category_id, not both",
            )
        if category_key:
            category = self.category_repo.get_by_key(category_key)
            if category is None:
                raise NotFoundAppError(
                    message="الفئة غير موجودة",
                    message_en="Category not found",
                )
            return category
        if category_id:
            try:
                parsed = uuid.UUID(category_id)
            except ValueError as exc:
                raise ValidationAppError(
                    message="معرف الفئة غير صالح",
                    message_en="Invalid category_id",
                ) from exc
            category = self.category_repo.get_by_id(parsed)
            if category is None:
                raise NotFoundAppError(
                    message="الفئة غير موجودة",
                    message_en="Category not found",
                )
            return category
        return None

    @staticmethod
    def _category_out(category: PromptCategory) -> CategoryOut:
        return CategoryOut(
            id=str(category.id),
            key=category.key,
            name_ar=category.name_ar,
            name_en=category.name_en,
            sort_order=category.sort_order,
        )
