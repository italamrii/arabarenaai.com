#!/bin/sh
# Production entrypoint: run migrations, then start API.
# Render sets PORT automatically. Local fallback: 8000.
set -e

cd "$(dirname "$0")/.."

echo "[start] Running database migrations..."
alembic upgrade head

echo "[start] Starting uvicorn on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
