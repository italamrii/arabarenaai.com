-- Idempotent session presence table for admin online-user metrics.

CREATE TABLE IF NOT EXISTS session_presence (
    session_id VARCHAR(64) PRIMARY KEY,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_path VARCHAR(256),
    user_agent_hash VARCHAR(64),
    ip_hash VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_session_presence_last_seen ON session_presence (last_seen_at);
CREATE INDEX IF NOT EXISTS idx_session_presence_first_seen ON session_presence (first_seen_at);
