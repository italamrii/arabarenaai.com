-- Idempotent platform settings table for maintenance mode and other flags.

CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY,
    key VARCHAR(64) NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO platform_settings (id, key, value)
VALUES (
    '00000000-0000-4000-8000-000000000001',
    'maintenance_mode',
    jsonb_build_object(
        'enabled', false,
        'message_ar', 'نقوم حالياً بأعمال صيانة وتحسينات على المنصة. سنعود قريباً.',
        'message_en', 'We are performing maintenance and improvements. We will be back soon.',
        'estimated_return', 'قريباً'
    )
)
ON CONFLICT (key) DO NOTHING;
