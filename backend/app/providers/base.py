from dataclasses import dataclass
from typing import Protocol


@dataclass
class CompletionResult:
    content: str
    response_time_ms: int
    input_tokens: int | None = None
    output_tokens: int | None = None


@dataclass
class HealthResult:
    status: str
    latency_ms: int | None = None
    message_ar: str | None = None


class ProviderAdapter(Protocol):
    key: str
    name_ar: str

    async def complete(
        self,
        prompt: str,
        model_key: str,
        *,
        max_tokens: int,
        timeout_ms: int,
    ) -> CompletionResult: ...

    async def health_check(self) -> HealthResult: ...

    def is_configured(self) -> bool: ...
