# Build from repository root:
#   docker build -f backend/Dockerfile .
#
# Used by Render (dockerContext: .) and local production smoke tests.

FROM python:3.12-slim

WORKDIR /app/backend

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml ./
RUN pip install --no-cache-dir .

COPY backend/app ./app
COPY backend/alembic.ini ./
COPY backend/scripts ./scripts
COPY database/migrations ../database/migrations

RUN chmod +x ./scripts/start-production.sh

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

CMD ["./scripts/start-production.sh"]
