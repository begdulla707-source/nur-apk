# Nur oqiw — Android Firebase setup

## Project / app IDs (owner supplied)
- Firebase project: `nur-oqiw`
- Project number: `1023539144417`
- Android app ID: `1:1023539144417:android:2a69b6bb4bbd40a82979a0`
- Android applicationId: `uz.nuroqiworayi.app`

## Implemented
- `android/app/google-services.json` configured from the project identifiers
  and key shared by the owner. **This is reconstructed from owner-supplied
  information, not an independently downloaded official configuration file.**
  For production, replace it with the untouched `google-services.json` file
  downloaded for the exact Android app from Firebase Console.
- Google Services Gradle plugin 4.5.0, Firebase Android BoM 34.19.0,
  `firebase-common` SDK.
- FirebaseApp initialized in Android MainActivity; initialization status
  recorded in Android Logcat with tag `NurOqiwFirebase`.
- Existing Render REST API and Neon Postgres are unchanged.
- The iOS-jade owner portfolio is bundled offline in the same Android WebView.
- The admin dashboard continues to require the server-side admin login;
  the publicly visible profile badge does not grant privileges.
- No client-side API keys are provided to the HTML via Javascript bridge.

## Not included / still pending
- No Firestore, Firebase Authentication, Storage or FCM feature is enabled
  just by registering the app. These require explicit product configuration
  and corresponding security rules in Firebase Console.
- No production keystore, Play Store account, AAB signing, or Google Play
  submission. The APK is a debug-signed preview.
- Firebase network connectivity to the owner's project must be verified
  on a physical Android device. Successful CI proves compilation and
  packaged configuration only.

## Owner verification
1. Firebase Console > Project settings > Your apps > Android
   and confirm package is exactly `uz.nuroqiworayi.app`.
2. Download the **new**, original `google-services.json` for that app.
   Compare Firebase App ID and package against the values above.
3. Before releasing to public users, restrict exposed Firebase API keys
   appropriately and configure access/security rules for every enabled
   Firebase product.
4. Never commit privileged service-account JSON or admin credentials.

Documentation: https://firebase.google.com/docs/android/setup
