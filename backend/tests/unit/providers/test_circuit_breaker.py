from app.providers.circuit_breaker import CircuitBreaker
from app.providers.registry import reset_provider_registry


def test_circuit_breaker_reset_all() -> None:
    breaker = CircuitBreaker(failure_threshold=1, recovery_seconds=3600)
    breaker.record_failure("openai")
    assert breaker.is_open("openai") is True
    breaker.reset_all()
    assert breaker.is_open("openai") is False


def test_reset_provider_registry_clears_breaker() -> None:
    from app.providers.registry import _circuit_breaker

    _circuit_breaker.record_failure("openai")
    _circuit_breaker.record_failure("openai")
    _circuit_breaker.record_failure("openai")
    _circuit_breaker.record_failure("openai")
    _circuit_breaker.record_failure("openai")
    assert _circuit_breaker.is_open("openai") is True
    reset_provider_registry()
    assert _circuit_breaker.is_open("openai") is False
