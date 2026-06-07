import uuid

from app.core.config import Settings

VALID_CATEGORY_KEYS = frozenset(
    {
        "business",
        "startup",
        "coding",
        "research",
        "marketing",
        "arabic_writing",
        "legal",
        "general",
    }
)


def validate_model_count(count: int, settings: Settings) -> None:
    if count < settings.min_models or count > settings.max_models:
        raise ValueError(
            f"Model count must be between {settings.min_models} and {settings.max_models}"
        )


def validate_prompt_length(prompt: str, settings: Settings) -> str:
    trimmed = prompt.strip()
    if not trimmed:
        raise ValueError("Prompt cannot be empty")
    if len(trimmed) > settings.max_prompt_length:
        raise ValueError(f"Prompt exceeds {settings.max_prompt_length} characters")
    return trimmed


def validate_category_key(key: str) -> None:
    if key not in VALID_CATEGORY_KEYS:
        raise ValueError(f"Invalid category key: {key}")


def should_use_fallback(confidence: float, threshold: float) -> bool:
    return confidence < threshold
