# Nur oqiw orayi — Windows PC

Native Windows portable `.exe` powered by Electron. It opens the existing Nur oqiw orayi application at `https://nur-apk.mcweb.uz/` in its own secure Windows window.

## What is included

- Independent application window, not a browser tab; no additional browser required.
- Existing PC dashboard, admin panel, student lists, ranking, attendance, payments, OCR and file import are served by the current Nur APK website.
- File-picker uploads use native Windows dialogs.
- Minimal emerald offline screen, F5 or Ctrl+R refresh.
- Secure Chromium sandbox; no embedded tokens, no Node.js integration in remote content.
- No automatic file downloads or elevated privileges; requires an internet connection.

## Build

Build on **Windows x64** using `npm install` then `npm run build:win`. GitHub Actions workflow `Windows EXE` builds the portable artifact and publishes it at Releases.

Note: this is a desktop wrapper of the *current hosted app*, not an independently functioning offline server. Windows SmartScreen may warn because preview builds are unsigned.
