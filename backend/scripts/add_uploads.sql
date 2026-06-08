-- Phase 1 attachment support (run manually if not using Alembic autogenerate)

CREATE TABLE IF NOT EXISTS uploads (
    id UUID PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    storage_key VARCHAR(512) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_uploads_session_id ON uploads (session_id);

ALTER TABLE comparisons
    ADD COLUMN IF NOT EXISTS upload_id UUID NULL REFERENCES uploads(id) ON DELETE SET NULL;
