import asyncio
import logging

from contextlib import asynccontextmanager



from fastapi import FastAPI, Request

from fastapi.exceptions import RequestValidationError

from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import JSONResponse



from app.api.router import api_router

from app.core.config import get_settings, reload_settings
from app.core.database import SessionLocal
from app.core.startup_patches import apply_startup_patches
from app.services.comparison_watchdog import sweep_stuck_comparisons

from app.core.exceptions import AppError, error_response

from app.core.middleware import LoggingMiddleware, RequestIdMiddleware

from app.observability.logging_config import configure_logging, log_event

from app.providers.registry import get_provider_registry, reset_provider_registry



logger = logging.getLogger(__name__)





@asynccontextmanager

async def lifespan(_app: FastAPI):

    reset_provider_registry()

    settings = reload_settings()

    registry = get_provider_registry()

    log_event(
        logger,
        "app.circuit_breakers.startup",
        circuit_breakers=registry.circuit_breaker_states(),
    )



    configure_logging(level=settings.log_level, log_format=settings.log_format)

    apply_startup_patches()

    db = SessionLocal()
    try:
        swept = sweep_stuck_comparisons(db, settings)
        if swept:
            log_event(logger, "app.startup.watchdog_sweep", swept=swept)
    finally:
        db.close()

    async def _watchdog_loop() -> None:
        while True:
            await asyncio.sleep(300)
            sweep_db = SessionLocal()
            try:
                sweep_stuck_comparisons(sweep_db, get_settings())
            except Exception:
                logger.exception("comparison.watchdog.loop_failed")
            finally:
                sweep_db.close()

    watchdog_task = asyncio.create_task(_watchdog_loop())

    log_event(

        logger,

        "app.started",

        version=settings.app_version,

        log_level=settings.log_level,

        log_format=settings.log_format,

        env_file_path=settings.env_file_path,

        env_file_exists=settings.env_file_exists,

        cwd=str(__import__("pathlib").Path.cwd()),

        openai_api_key_configured=settings.openai_api_key_configured,

        provider_keys_configured=settings.provider_keys_configured,

        registry_openai_key_configured=registry.openai_configured(),
        registered_health_routes=[
            getattr(r, "path", None)
            for r in _app.routes
            if hasattr(r, "path") and getattr(r, "path", "").startswith("/v1/health")
        ],
    )

    yield

    watchdog_task.cancel()
    try:
        await watchdog_task
    except asyncio.CancelledError:
        pass

    log_event(logger, "app.stopped")





settings = get_settings()



_docs_kwargs = (
    {"docs_url": None, "redoc_url": None, "openapi_url": None}
    if settings.is_production
    else {}
)

app = FastAPI(
    title="Arab Benchmark AI API",
    version=settings.app_version,
    lifespan=lifespan,
    **_docs_kwargs,
)



app.add_middleware(RequestIdMiddleware)

app.add_middleware(LoggingMiddleware)

app.add_middleware(

    CORSMiddleware,

    allow_origins=settings.cors_origin_list,

    allow_credentials=True,

    allow_methods=["GET", "POST", "OPTIONS"],

    allow_headers=["*"],

)





@app.exception_handler(AppError)

async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:

    request_id = getattr(request.state, "request_id", "-")

    log_event(

        logger,

        "app.error",

        level=logging.WARNING,

        request_id=request_id,

        error_code=exc.code,

        status_code=exc.status_code,

        path=request.url.path,

    )

    return error_response(request, exc)





@app.exception_handler(RequestValidationError)

async def validation_error_handler(

    request: Request,

    exc: RequestValidationError,

) -> JSONResponse:

    from app.core.exceptions import ValidationAppError



    request_id = getattr(request.state, "request_id", "-")

    log_event(

        logger,

        "app.validation_error",

        level=logging.WARNING,

        request_id=request_id,

        path=request.url.path,

        error_count=len(exc.errors()),

    )



    return error_response(

        request,

        ValidationAppError(

            message="بيانات الطلب غير صالحة",

            message_en="Request validation failed",

            details=[{"field": ".".join(str(p) for p in err["loc"]), "issue": err["msg"]} for err in exc.errors()],

        ),

    )





@app.exception_handler(Exception)

async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:

    request_id = getattr(request.state, "request_id", "-")

    log_event(

        logger,

        "app.unhandled_error",

        level=logging.ERROR,

        exc_info=exc,

        request_id=request_id,

        path=request.url.path,

        error_type=type(exc).__name__,

    )

    return error_response(

        request,

        AppError(

            code="INTERNAL_ERROR",

            message="حدث خطأ غير متوقع",

            message_en="An unexpected error occurred",

            status_code=500,

        ),

    )





app.include_router(api_router, prefix="/v1")


