-- Nur APK contact inbox, separate from bot data.
CREATE TABLE IF NOT EXISTS app_contact_messages (
 id BIGSERIAL PRIMARY KEY,
 full_name VARCHAR(120) NOT NULL,
 sender_type VARCHAR(16) NOT NULL CHECK(sender_type IN ('student','parent')),
 subject_code VARCHAR(16),
 message TEXT NOT NULL CHECK(length(message) BETWEEN 5 AND 2000),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 is_read BOOLEAN NOT NULL DEFAULT FALSE,
 read_at TIMESTAMPTZ,
 archived BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS app_contact_unread ON app_contact_messages(is_read,created_at DESC) WHERE NOT archived;
