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

-- Each anonymous sender holds a high-entropy, one-time-issued reply capability.
-- The database stores only its SHA-256 and legacy messages remain without a token.
ALTER TABLE app_contact_messages ADD COLUMN IF NOT EXISTS reply_token_hash VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS app_contact_token_hash_unique
    ON app_contact_messages(reply_token_hash)
    WHERE reply_token_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS app_contact_replies (
 id BIGSERIAL PRIMARY KEY,
 message_id BIGINT NOT NULL REFERENCES app_contact_messages(id) ON DELETE CASCADE,
 body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 1500),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_contact_replies_message
    ON app_contact_replies(message_id, created_at DESC);
