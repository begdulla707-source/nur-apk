-- Nur APK premium admin migration. Idempotent and separate from Telegram bot.
ALTER TABLE app_students ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE app_students ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE app_students ADD COLUMN IF NOT EXISTS enrolled_at DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE app_notices ADD COLUMN IF NOT EXISTS group_id BIGINT REFERENCES app_groups(id);
ALTER TABLE app_notices ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE app_notices ADD COLUMN IF NOT EXISTS publish_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE app_notices ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS app_audit (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id BIGINT,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_audit_recent_idx ON app_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS app_students_archive_idx ON app_students(group_id, archived);
CREATE INDEX IF NOT EXISTS app_notices_schedule_idx ON app_notices(publish_at,expires_at);
