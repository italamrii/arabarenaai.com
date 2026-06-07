import time
from threading import Lock


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_seconds: int = 60) -> None:
        self.failure_threshold = failure_threshold
        self.recovery_seconds = recovery_seconds
        self._failures: dict[str, int] = {}
        self._opened_at: dict[str, float] = {}
        self._lock = Lock()

    def is_open(self, provider_key: str) -> bool:
        with self._lock:
            opened = self._opened_at.get(provider_key)
            if opened is None:
                return False
            if time.time() - opened >= self.recovery_seconds:
                self._opened_at.pop(provider_key, None)
                self._failures[provider_key] = 0
                return False
            return True

    def record_success(self, provider_key: str) -> None:
        with self._lock:
            self._failures[provider_key] = 0
            self._opened_at.pop(provider_key, None)

    def record_failure(self, provider_key: str) -> None:
        with self._lock:
            count = self._failures.get(provider_key, 0) + 1
            self._failures[provider_key] = count
            if count >= self.failure_threshold:
                self._opened_at[provider_key] = time.time()

    def reset_all(self) -> None:
        with self._lock:
            self._failures.clear()
            self._opened_at.clear()

    def reset_provider(self, provider_key: str) -> None:
        with self._lock:
            self._failures.pop(provider_key, None)
            self._opened_at.pop(provider_key, None)

    def snapshot(self) -> dict[str, bool]:
        with self._lock:
            keys = list(set(self._failures) | set(self._opened_at))
        return {key: self.is_open(key) for key in keys}
