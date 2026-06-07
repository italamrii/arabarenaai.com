from app.core.config import Settings


def validate_model_count(count: int, settings: Settings) -> None:
    min_models = settings.min_models_per_comparison
    max_models = settings.max_models_per_comparison
    if count < min_models or count > max_models:
        raise ValueError(
            f"Model count must be between {min_models} and {max_models}"
        )


def compute_comparison_status(success_count: int, total_count: int) -> str:
    if success_count == 0:
        return "failed"
    if success_count == total_count:
        return "completed"
    return "partial"


def can_vote_on_comparison(status: str) -> bool:
    return status in {"completed", "partial"}
