# Google Play & Firebase preparation — Nur Oqiw Orayi
## APK vs Play Store
Current v0.7+ APK is a test / preview build. For a Play Store launch, a release AAB must be built with a permanent signing key, uploaded via official Google Play Console and reviewed. Never disable Play Protect or promise suppression of side-load warnings.

## Firebase
1. Activate MFA for the Google account if Firebase requires it.
2. In Firebase Console create a distinct project named `nur-apk`; do NOT use the Telegram bot's project.
3. Register Android app id `uz.nuroqiworayi.app`.
4. Download `google-services.json` into Android app's local project (Firebase API keys are identifiers but restrict them appropriately); do not include private service-account JSON in source.
5. Decide whether Firebase Cloud Messaging is actually needed for phone push. For in-app announcements, Neon/Render API already handles storage.
6. If push is approved: Android notification permission on 13+, FCM token registration secured by user opt-in, a backend sender using server-managed service account and unsubscribe controls. No automatic marketing push.
7. Before app release, implement privacy policy and data-deletion contact details, TLS-only API, secure admin authentication, backups, anti-abuse and incident response.

## Play Market
1. Register official Play Console developer account and complete identity/business verification.
2. Set app name “Nur oqiw orayi”, description, contact, audience and data-safety form truthfully.
3. Prepare app screenshots, feature graphic, updated icon (DO NOT alter current approved premium icon), privacy policy URL and content rating.
4. Configure Play App Signing and generate securely signed release AAB (not debug APK). Keep key passwords out of repository.
5. Run internal/closed testing required for account type; remedy crashes, accessibility and edge cases.
6. Submit for review and publish to authorized countries.

## Privacy for student/parent contact messages
App stores full name, selected parent/student role, optionally subject and message for admin inbox. Avoid collecting unnecessary children's details. Determine parental notice/consent, deletion process and retention policy before publishing. Never make private notes/public contact messages available to students.

The user asked for a step-by-step activation checklist when they send **/playmarket**. Do not claim publication has occurred.
