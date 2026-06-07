import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.security import client_ip
from app.observability.logging_config import log_event
from app.observability.metrics import get_metrics

import logging

logger = logging.getLogger(__name__)


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-Id"] = request_id
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        request_id = getattr(request.state, "request_id", "-")
        start = time.perf_counter()
        ip = client_ip(request)
        path = request.url.path
        method = request.method

        log_event(
            logger,
            "http.request.started",
            request_id=request_id,
            method=method,
            path=path,
            client_ip=ip,
        )

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = int((time.perf_counter() - start) * 1000)
            get_metrics().record_request(
                method=method,
                path=path,
                status_code=500,
                duration_ms=duration_ms,
            )
            log_event(
                logger,
                "http.request.failed",
                level=logging.ERROR,
                request_id=request_id,
                method=method,
                path=path,
                client_ip=ip,
                duration_ms=duration_ms,
            )
            raise

        duration_ms = int((time.perf_counter() - start) * 1000)
        status_code = response.status_code

        get_metrics().record_request(
            method=method,
            path=path,
            status_code=status_code,
            duration_ms=duration_ms,
        )

        log_event(
            logger,
            "http.request.completed",
            request_id=request_id,
            method=method,
            path=path,
            client_ip=ip,
            status_code=status_code,
            duration_ms=duration_ms,
        )

        return response
