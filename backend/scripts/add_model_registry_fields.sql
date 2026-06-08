-- Idempotent model registry columns (supports_attachments, is_archived)
ALTER TABLE models ADD COLUMN IF NOT EXISTS supports_attachments BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE models ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

UPDATE models m
SET supports_attachments = true
FROM providers p
WHERE m.provider_id = p.id
  AND p.key IN ('openai', 'anthropic', 'google')
  AND m.is_placeholder = false
  AND m.supports_attachments = false;
