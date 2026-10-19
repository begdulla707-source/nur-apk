# Nur oqiw orayi — Android / Mobile App

This is a completely separate application from the Telegram testing bot.
The original emerald mobile theme stays unchanged.

## Website
Public mobile UI: https://nur-apk.vercel.app

## Android preview
Source in android/. GitHub Actions builds an installable debug APK and creates a prerelease at:
https://github.com/begdulla707-source/nur-apk/releases

> Preview builds use Android's debug signing key. Play Store builds need a dedicated permanent release signing key and Play Console setup.

## Data/API
Independent Render API service: https://nur-apk-api.onrender.com/api/health
Neon database: nur-oqiw-orayi-app (no Telegram bot tables).

Required private Render environment variables:
- DATABASE_URL: copy from the Neon Console, never commit.
- ADMIN_TOKEN_SHA256: SHA256 of the dedicated Nur APK administrator token.
- SESSION_SECRET: strong random secret for short-lived admin sessions.
- ALLOWED_ORIGINS: https://nur-apk.vercel.app

API uses read-only public endpoints and bearer-token-protected admin writes. Admin tokens are never embedded in HTML, APK, or repository.

### Features
- Subjects and groups (math A, B, C, V, G, J, H initially)
- Add/archive/rename groups and students
- Create date-specific sessions and enter 0-100 scores or DQ (absent)
- Ranking by average of completed assessments, excluding absences
- View results, student roster, and in-app notices
- 20-second foreground refresh for near-real-time changes
- Local theme switching; lightweight navigation translations
- Admin access via secret token, short-lived session, rate-limited login

### Limitations
- Initial backend deployment won't become healthy until DATABASE_URL is entered into the Render service.
- App announcements are in-app, not device push notifications (FCM still needed).
- Current app is an Android WebView shell loading the hosted site; needs internet.
- For production, configure monitoring, secure backups, Play Store signing, and a more resilient admin auth provider.
