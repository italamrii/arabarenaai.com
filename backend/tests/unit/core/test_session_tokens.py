from app.core.session_tokens import (
    create_signed_session_from_uuid,
    create_signed_session_id,
    extract_session_uuid,
    is_legacy_plain_uuid,
)


def test_signed_session_round_trip():
    secret = "test-secret-key"
    token, expires_at = create_signed_session_id(secret=secret, ttl_days=1)
    session_uuid = extract_session_uuid(token, secret=secret)
    assert session_uuid is not None
    assert token.count(".") == 2
    assert expires_at is not None


def test_rejects_tampered_signature():
    secret = "test-secret-key"
    token, _ = create_signed_session_id(secret=secret, ttl_days=1)
    parts = token.split(".")
    tampered = f"{parts[0]}.{parts[1]}.{'0' * 64}"
    assert extract_session_uuid(tampered, secret=secret) is None


def test_legacy_uuid_not_signed():
    assert is_legacy_plain_uuid("550e8400-e29b-41d4-a716-446655440000") is True


def test_upgrade_preserves_inner_uuid():
    secret = "test-secret-key"
    legacy = "550e8400-e29b-41d4-a716-446655440000"
    token, _ = create_signed_session_from_uuid(session_uuid=legacy, secret=secret, ttl_days=1)
    assert extract_session_uuid(token, secret=secret) == legacy
