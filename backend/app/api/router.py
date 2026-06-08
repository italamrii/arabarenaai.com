from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1 import (
    agents,
    analytics,
    categories,
    comparisons,
    debug,
    models,
    sessions,
    uploads,
    votes,
)

api_router = APIRouter()

# Health routes: /v1/health, /v1/health/env-debug, /v1/health/providers, /v1/health/diagnostics, /v1/health/admin-stats
api_router.include_router(health_router)
api_router.include_router(debug.router)

api_router.include_router(sessions.router, tags=["sessions"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(models.router, prefix="/models", tags=["models"])
api_router.include_router(uploads.router)
api_router.include_router(comparisons.router, prefix="/comparisons", tags=["comparisons"])
api_router.include_router(votes.router, tags=["votes"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
