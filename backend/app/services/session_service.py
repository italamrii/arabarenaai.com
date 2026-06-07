import uuid
from datetime import UTC, datetime, timedelta


class SessionService:
    @staticmethod
    def create_session() -> tuple[str, datetime]:
        session_id = str(uuid.uuid4())
        expires_at = datetime.now(UTC) + timedelta(days=30)
        return session_id, expires_at
