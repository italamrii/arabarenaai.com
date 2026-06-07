"""No-op analytics cache for MVP. Replace with Redis in Phase 2."""

from typing import Any


class AnalyticsCache:
    def get(self, _key: str) -> Any | None:
        return None

    def set(self, _key: str, _value: Any, _ttl_seconds: int = 300) -> None:
        return None

    def invalidate_prefix(self, _prefix: str) -> None:
        return None


cache = AnalyticsCache()
