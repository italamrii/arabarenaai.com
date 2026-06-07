from app.core.config import Settings


def validate_model_count(count: int, settings: Settings) -> None:
    if count < settings.min_models or count > settings.max_models:
        raise ValueError(
            f"Model count must be between {settings.min_models} and {settings.max_models}"
        )


def compute_comparison_status(success_count: int, total_count: int) -> str:
    if success_count == 0:
        return "failed"
    if success_count == total_count:
        return "completed"
    return "partial"


def can_vote_on_comparison(status: str) -> bool:
    return status in {"completed", "partial"}
