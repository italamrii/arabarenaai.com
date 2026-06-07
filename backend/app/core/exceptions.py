from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        message_en: str,
        status_code: int = 400,
        details: list[dict[str, Any]] | None = None,
    ) -> None:
        self.code = code
        self.message = message
        self.message_en = message_en
        self.status_code = status_code
        self.details = details or []
        super().__init__(message_en)


class ValidationAppError(AppError):
    def __init__(
        self,
        message: str,
        message_en: str,
        details: list[dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            message_en=message_en,
            status_code=400,
            details=details,
        )


class NotFoundAppError(AppError):
    def __init__(self, message: str, message_en: str) -> None:
        super().__init__(
            code="NOT_FOUND",
            message=message,
            message_en=message_en,
            status_code=404,
        )


class ConflictAppError(AppError):
    def __init__(self, code: str, message: str, message_en: str) -> None:
        super().__init__(
            code=code,
            message=message,
            message_en=message_en,
            status_code=409,
        )


class UnprocessableAppError(AppError):
    def __init__(self, code: str, message: str, message_en: str) -> None:
        super().__init__(
            code=code,
            message=message,
            message_en=message_en,
            status_code=422,
        )


class RateLimitAppError(AppError):
    def __init__(self) -> None:
        super().__init__(
            code="RATE_LIMIT_EXCEEDED",
            message="تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً",
            message_en="Rate limit exceeded",
            status_code=429,
        )


class ProviderUnavailableAppError(AppError):
    def __init__(self) -> None:
        super().__init__(
            code="PROVIDER_ERROR",
            message="تعذر الحصول على ردود من جميع النماذج",
            message_en="All providers failed",
            status_code=503,
        )


def error_response(request: Request, exc: AppError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "message_en": exc.message_en,
                "details": exc.details,
            },
            "meta": {"request_id": request_id},
        },
    )
