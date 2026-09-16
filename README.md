# My Personal Diary v7

## Features
- Daily diary pages with previous/next navigation
- Bold, underline, italic and lists
- Monthly diary calendar and diary events
- Google Calendar read-only integration
- Photo/document attachments using IndexedDB
- Memory Gallery & Timeline grouped by diary date
- Paste images directly into the diary
- Drag/swipe page turning on touch devices
- Backup/restore including entries, events and attachments
- Print current page, print all pages and Android Save as PDF
- PWA/offline support

## Google Calendar setup (one-time)
Google Calendar integration requires your own Google OAuth 2.0 Web application Client ID. The app never asks for or stores a Google client secret.

1. Open Google Cloud Console: https://console.cloud.google.com/
2. Create/select a Google Cloud project.
3. Enable **Google Calendar API** for the project.
4. Configure the OAuth consent screen for the app. For personal use, a suitable testing configuration is normally enough.
5. Create **OAuth Client ID â†’ Web application**.
6. Under **Authorized JavaScript origins**, add the exact origin of the diary, for example your GitHub Pages origin (do not add a path such as `/my-personal-diary/`).
7. Copy the Client ID ending in `apps.googleusercontent.com`.
8. In the diary open **ðŸ“… Google Calendar â†’ Google Calendar Setup**, paste the Client ID and save it.
9. Press **Connect / Refresh** and approve read-only calendar access.

### Important security note
Do not put a Google client secret in `index.html`. This app uses the browser OAuth token flow and requests only `calendar.readonly` access.

## Updating GitHub Pages
Replace `index.html`, `manifest.json`, and `service-worker.js` in the existing repository with the files in this folder. Commit the changes, wait for GitHub Pages to publish, then refresh the installed app. Make a diary backup before clearing browser site data.
