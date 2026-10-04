# Synchros mobile

The iPhone and Android app for Synchros: set intentions, log signs, thread them together, and walk the nine-stage journey. Built with Expo SDK 57 (React Native 0.86), Expo Router and on-device SQLite. No backend, no account.

The original Flask web app lives in the repository root and is untouched.

## Run it on your phone (today)

1. Install **Expo Go** from the App Store or Google Play.
2. On your computer (Node 20+):
   ```bash
   cd mobile
   npm install
   npx expo start
   ```
3. Scan the QR code (iPhone: Camera app; Android: Expo Go).

Everything in the app runs in Expo Go, including the database, photos, sharing and reminders.

## What's inside

| Area | Where |
|---|---|
| Screens (Expo Router) | `src/app/` |
| Data: SQLite storage, in-memory store, derived stats | `src/data/` |
| Journey content (original writing) and vocab | `src/content/` |
| Design tokens: colour, type, spacing | `src/theme/tokens.ts` |
| Shared UI | `src/ui/` |
| Backups, reminders, photo storage | `src/lib/` |

`*.native.ts` files run on phones; the plain `.ts` twin is a browser fallback used for web previews only.

**Data model.** Intentions, signs, vision cards, reflections and journey stages live in `synchros.db` on the device. Migrations run by `PRAGMA user_version` in `src/data/storage.native.ts`; add a numbered entry to `MIGRATIONS` and bump `DB_VERSION` to change the schema. Signs keep a loose link to intentions (no foreign key) so editing never cascades; deleting an intention unthreads its signs instead of deleting them.

**Identity.** Colour carries meaning: ultramarine is the inner world (intentions), sunbeam is the outer world (signs), magenta is a thread between them. Type is Bricolage Grotesque for display and Figtree for reading.

## Checks

```bash
npm run typecheck
npm run lint
npx expo-doctor
```

## Launch runbook

Do these in order. Steps marked **you** need your own accounts or payment.

### 1. Test on real phones (day 1)
Run through this on at least one iPhone and one Android phone in Expo Go:
- [ ] Onboarding → reminder permission prompt appears → Today screen
- [ ] New intention → appears in Intentions → detail opens
- [ ] Gold button → log a sign threaded to it → Today circles and counts update
- [ ] Mark an intention manifested with an outcome → moves to the Manifested tab
- [ ] Journey stage 1: mark practice done, answer 3 reflections, complete → stage 2 opens
- [ ] Stage 7: live question shows on Today
- [ ] Vision board: add a photo card, drag, pinch, twist, close and reopen the app → position kept
- [ ] Settings: switch Light/Dark; change reminder time; save a backup; delete all data; restore the backup
- [ ] Force-quit and reopen: everything is still there

### 2. Accounts (**you**)
- **Expo** (free): https://expo.dev/signup
- **Apple Developer Program**: US$99/year. Enrolling as an individual lists your legal name as the seller on the App Store; to show "EPICWORLD" instead you must enrol as an organisation, which needs a registered business and a D-U-N-S number.
- **Google Play Console**: US$25 one-time. New personal accounts must run a closed test with at least 12 testers opted in for 14 continuous days before they can apply for production access. Start this as early as possible; it sets the Android launch date.

### 3. Link the project to EAS (5 minutes)
```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest init        # writes your projectId into app.json — commit it
```

### 4. iOS: build → TestFlight → App Store
```bash
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --latest
```
EAS creates the certificates and App Store Connect record for you when prompted. In App Store Connect: add testers in TestFlight, fill the listing from `STORE_LISTING.md`, upload `store-assets/ios-6.9in/`, set App Privacy to "Data Not Collected", then Submit for Review.

### 5. Android: build → closed test → production
```bash
npx eas-cli@latest build --platform android --profile production
```
Download the `.aab`. In Play Console create the app, complete the Data safety form and listing from `STORE_LISTING.md`, then upload the `.aab` by hand to a **Closed testing** track (Google requires the first upload to be manual). Add your 12+ testers' Google emails and share the opt-in link. After 14 days, apply for production access from the Dashboard. Later builds can go up with `npx eas-cli@latest submit --platform android`.

### 6. Before you submit
- [ ] The privacy policy URL loads publicly (it points at `mobile/PRIVACY.md` on the `main` branch, so merge first)
- [ ] App name is available in App Store Connect (if "Synchros: Signs & Intentions" is taken, try "Synchros Journal")
- [ ] Version in `app.json` is `1.0.0`; EAS increments build numbers automatically

### Updates after launch
JavaScript-only fixes can ship instantly with EAS Update (`npx eas-cli@latest update:configure`, then `npx eas-cli@latest update`). Anything that adds a native module needs a new store build.
