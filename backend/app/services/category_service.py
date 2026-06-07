import json
import logging
from dataclasses import dataclass

from openai import AsyncOpenAI
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.exceptions import UnprocessableAppError, ValidationAppError
from app.domain.categories import should_use_fallback, validate_category_key
from app.models.category import PromptCategory
from app.repositories.comparison_repo import CategoryRepository

logger = logging.getLogger(__name__)

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "business": ["business", "أعمال", "شركة", "مبيعات", "إيرادات"],
    "startup": ["startup", "ناشئة", "ريادة", "مستثمر", "pitch"],
    "coding": ["code", "برمجة", "python", "javascript", "api", "bug", "function"],
    "research": ["research", "بحث", "study", "paper", "تحليل", "دراسة"],
    "marketing": ["marketing", "تسويق", "campaign", "إعلان", "brand"],
    "arabic_writing": ["write", "اكتب", "مقال", "قصة", "شعر", "كتابة"],
    "legal": ["legal", "قانون", "contract", "عقد", "محام", "court"],
}


@dataclass
class DetectionResult:
    key: str
    confidence: float


@dataclass
class ResolvedCategory:
    category: PromptCategory
    source: str
    confidence: float | None


class CategoryService:
    def __init__(self, db: Session, settings: Settings) -> None:
        self.db = db
        self.settings = settings
        self.repo = CategoryRepository(db)

    def list_categories(self) -> list[PromptCategory]:
        return self.repo.list_enabled()

    async def resolve_for_comparison(
        self,
        *,
        category_mode: str,
        category_key: str | None,
        prompt: str,
    ) -> ResolvedCategory:
        if category_mode == "manual":
            if not category_key:
                raise ValidationAppError(
                    message="يجب اختيار فئة عند الوضع اليدوي",
                    message_en="category_key is required when category_mode is manual",
                    details=[{"field": "category_key", "issue": "required"}],
                )
            return self._resolve_manual(category_key)

        if category_key:
            return self._resolve_manual(category_key, source="manual")

        return await self.detect_category(prompt)

    async def detect_category(self, prompt: str) -> ResolvedCategory:
        detected = await self._detect_with_llm(prompt)
        if detected is None:
            detected = self._detect_with_keywords(prompt)

        category = self.repo.get_by_key(detected.key)
        if category is None:
            category = self.repo.get_by_key("general")
            if category is None:
                raise UnprocessableAppError(
                    code="CATEGORY_INVALID",
                    message="فئة عام غير متوفرة في النظام",
                    message_en="Default general category is missing",
                )
            return ResolvedCategory(category=category, source="auto", confidence=0.0)

        if should_use_fallback(
            detected.confidence,
            self.settings.category_confidence_threshold,
        ):
            general = self.repo.get_by_key("general")
            if general:
                return ResolvedCategory(
                    category=general,
                    source="auto",
                    confidence=detected.confidence,
                )

        return ResolvedCategory(
            category=category,
            source="auto",
            confidence=detected.confidence,
        )

    def _resolve_manual(self, category_key: str, source: str = "manual") -> ResolvedCategory:
        try:
            validate_category_key(category_key)
        except ValueError as exc:
            raise ValidationAppError(
                message="فئة غير صالحة",
                message_en=str(exc),
                details=[{"field": "category_key", "issue": "invalid"}],
            ) from exc

        category = self.repo.get_by_key(category_key)
        if category is None or not category.is_enabled:
            raise ValidationAppError(
                message="فئة غير معروفة أو غير مفعّلة",
                message_en="Unknown or disabled category_key",
                details=[{"field": "category_key", "issue": "invalid"}],
            )
        return ResolvedCategory(category=category, source=source, confidence=None)

    def _detect_with_keywords(self, prompt: str) -> DetectionResult:
        lowered = prompt.lower()
        scores = {key: 0 for key in CATEGORY_KEYWORDS}
        for key, keywords in CATEGORY_KEYWORDS.items():
            for keyword in keywords:
                if keyword.lower() in lowered:
                    scores[key] += 1
        best_key = max(scores, key=scores.get)
        best_score = scores[best_key]
        if best_score == 0:
            return DetectionResult(key="general", confidence=0.5)
        confidence = min(0.75, 0.4 + best_score * 0.1)
        return DetectionResult(key=best_key, confidence=confidence)

    async def _detect_with_llm(self, prompt: str) -> DetectionResult | None:
        if not self.settings.openai_api_key:
            return None

        client = AsyncOpenAI(api_key=self.settings.openai_api_key)
        system_prompt = (
            "Classify the user prompt into exactly one category key from this list: "
            "business, startup, coding, research, marketing, arabic_writing, legal, general. "
            'Respond with JSON only: {"category_key": "...", "confidence": 0.0-1.0}'
        )
        try:
            response = await client.chat.completions.create(
                model=self.settings.category_classifier_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                max_tokens=100,
                timeout=15.0,
            )
            raw = response.choices[0].message.content or "{}"
            data = json.loads(raw)
            key = str(data.get("category_key", "general"))
            confidence = float(data.get("confidence", 0.5))
            if key not in CATEGORY_KEYWORDS and key != "general":
                key = "general"
                confidence = 0.5
            return DetectionResult(key=key, confidence=confidence)
        except Exception as exc:
            logger.warning("category_llm_detect_failed", exc_info=exc)
            return None
