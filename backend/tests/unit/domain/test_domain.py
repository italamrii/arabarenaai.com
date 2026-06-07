import pytest

from app.core.config import Settings
from app.domain.categories import validate_category_key
from app.domain.comparison import compute_comparison_status, validate_model_count


def test_validate_model_count() -> None:
    settings = Settings()
    validate_model_count(2, settings)
    validate_model_count(10, settings)
    with pytest.raises(ValueError):
        validate_model_count(1, settings)


def test_compute_comparison_status() -> None:
    assert compute_comparison_status(0, 3) == "failed"
    assert compute_comparison_status(3, 3) == "completed"
    assert compute_comparison_status(2, 3) == "partial"


def test_validate_category_key() -> None:
    validate_category_key("coding")
    with pytest.raises(ValueError):
        validate_category_key("invalid")
