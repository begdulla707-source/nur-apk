-- Ranking settings for Nur APK, separate from Telegram bot.
CREATE TABLE IF NOT EXISTS app_ranking_settings (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    period_start DATE,
    period_end DATE,
    top_limit SMALLINT NOT NULL DEFAULT 15 CHECK (top_limit BETWEEN 1 AND 50),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (period_start IS NULL OR period_end IS NULL OR period_start <= period_end)
);
INSERT INTO app_ranking_settings(singleton,is_published,top_limit) VALUES (TRUE,TRUE,15) ON CONFLICT(singleton) DO NOTHING;
