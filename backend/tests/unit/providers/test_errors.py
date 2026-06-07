from app.providers.errors import debug_fields_from_content_structured, resolve_response_debug_fields


def test_debug_fields_from_content_structured_redacts_secrets() -> None:
    payload = {
        "error_code": "invalid_api_key",
        "error_message_debug": "Incorrect API key: sk-proj-abc123secretkey",
        "provider_key": "openai",
        "model_key": "gpt-4o-mini",
        "exception_class": "AuthenticationError",
        "status_code": 401,
        "request_id": "req_abc",
    }
    fields = debug_fields_from_content_structured(payload)
    assert fields["error_code"] == "invalid_api_key"
    assert "sk-proj" not in (fields["error_message_debug"] or "")
    assert "[REDACTED]" in (fields["error_message_debug"] or "")
    assert fields["provider_key"] == "openai"
    assert fields["model_key"] == "gpt-4o-mini"
    assert fields["status_code"] == 401
    assert fields["request_id"] == "req_abc"


def test_debug_fields_from_content_structured_empty() -> None:
    fields = debug_fields_from_content_structured(None)
    assert fields["error_code"] is None
    assert fields["error_message_debug"] is None


def test_resolve_response_debug_fields_circuit_breaker_fallback() -> None:
    fields = resolve_response_debug_fields(
        content_structured=None,
        status="error",
        provider_key="openai",
        model_key="gpt-4o-mini",
        circuit_open=True,
    )
    assert fields["error_code"] == "circuit_breaker_open"
    assert fields["provider_key"] == "openai"
    assert fields["model_key"] == "gpt-4o-mini"
