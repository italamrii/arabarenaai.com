.PHONY: dev migrate downgrade test lint install

install:
	cd backend && pip install -e ".[dev]"

migrate:
	cd backend && alembic upgrade head

downgrade:
	cd backend && alembic downgrade -1

dev:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

dev-all:
	@echo "Run backend (port 8000) and frontend (port 3000) in separate terminals"

test:
	cd backend && pytest

lint:
	cd backend && ruff check app tests

docker-up:
	docker compose up -d postgres

docker-migrate:
	docker compose run --rm api alembic upgrade head
