-- Nur APK payments: no live charges or automatic provider claims until merchant approval.
CREATE TABLE IF NOT EXISTS app_payment_settings (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK(singleton),
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  payee_name TEXT,
  payee_verified BOOLEAN NOT NULL DEFAULT FALSE,
  qr_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO app_payment_settings(singleton) VALUES(TRUE) ON CONFLICT(singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS app_payment_tariffs (
  group_id BIGINT PRIMARY KEY REFERENCES app_groups(id),
  amount_uzs INTEGER NOT NULL CHECK(amount_uzs BETWEEN 1000 AND 100000000),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_payment_requests (
 id BIGSERIAL PRIMARY KEY,
 order_code TEXT NOT NULL UNIQUE,
 receipt_hash CHAR(64) NOT NULL UNIQUE,
 payer_name TEXT NOT NULL CHECK(length(payer_name) BETWEEN 3 AND 120),
 payer_type TEXT NOT NULL CHECK(payer_type IN ('student','parent')),
 group_id BIGINT NOT NULL REFERENCES app_groups(id),
 period_month DATE NOT NULL,
 amount_uzs INTEGER NOT NULL CHECK(amount_uzs BETWEEN 1000 AND 100000000),
 status TEXT NOT NULL DEFAULT 'created' CHECK(status IN ('created','submitted','confirmed','rejected')),
 claim_reference TEXT UNIQUE,
 claim_note TEXT,
 verified_transaction TEXT UNIQUE,
 admin_note TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 submitted_at TIMESTAMPTZ,
 confirmed_at TIMESTAMPTZ,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_payment_recent_idx ON app_payment_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS app_payment_status_idx ON app_payment_requests(status,created_at DESC);
