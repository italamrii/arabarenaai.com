import time
from collections import defaultdict
from threading import Lock

from fastapi import Request

from app.core.exceptions import RateLimitAppError


class InMemoryRateLimiter:
    """Simple in-process rate limiter for MVP. Replace with Redis in Phase 2."""

    def __init__(self) -> None:
        self._buckets: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def check(self, key: str, limit: int, window_seconds: int) -> tuple[int, int, int]:
        now = time.time()
        window_start = now - window_seconds

        with self._lock:
            timestamps = [ts for ts in self._buckets[key] if ts > window_start]
            if len(timestamps) >= limit:
                reset_at = int(timestamps[0] + window_seconds)
                raise RateLimitAppError()

            timestamps.append(now)
            self._buckets[key] = timestamps
            remaining = max(0, limit - len(timestamps))
            reset_at = int(now + window_seconds)

        return limit, remaining, reset_at


rate_limiter = InMemoryRateLimiter()


def apply_rate_limit_headers(response, limit: int, remaining: int, reset_at: int) -> None:
    response.headers["X-RateLimit-Limit"] = str(limit)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(reset_at)


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"
