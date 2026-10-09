# Bubbles UI Prototype

Temporary, clickable React Native (Expo) prototype for customer feedback and user testing. Not production code: all data is hardcoded in `data.ts`, and there is no backend.

| File | What it is |
|---|---|
| `theme.ts` | Design tokens: colors, Bubble colors, fonts, spacing |
| `components.tsx` | Shared UI pieces (bubbles, pins, buttons, menus, sheets) |
| `HomeScreen.tsx` | Bubbles tab: map, Bubble row, bottom sheet, All Bubbles view |
| `InboxScreen.tsx`, `CalendarScreen.tsx`, `ProfileScreen.tsx` | Other tabs |
| `Details.tsx` | Person, pin, event, Bubble profile and Drop Pin views |
| `StyleReference.tsx` | Style reference page (Profile → Settings → Style reference) |

## Run it on Windows

### 1. Install the tools (one time)

Open **PowerShell** and run:

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
```

Close and reopen PowerShell, then check both work:

```powershell
node -v
git --version
```

`node -v` should print `v20` or newer.

### 2. Get the code (one time)

```powershell
git clone https://github.com/gcc-capstone/micro-bubbles.git
cd micro-bubbles
git checkout setup/ui-prototype
cd ui-prototype
npm install
```

Use `npm` (not `pnpm` or `yarn`) so you get the exact versions in `package-lock.json`.

### 3. Start it

```powershell
npx expo start
```

A QR code appears in the terminal. Pick one way to view the app:

- **On your phone (recommended, real maps):** install **Expo Go** from the App Store or Google Play. Connect the phone to the same Wi-Fi as your PC, then scan the QR code (iPhone: Camera app; Android: inside Expo Go).
  - If Windows asks whether Node.js can use the network, click **Allow** (private networks).
  - If the phone can't connect (common on school or public Wi-Fi), stop with `Ctrl+C` and run `npx expo start --tunnel` instead.
- **In a browser:** press `w`. Good for quick layout checks, but the map is a drawn placeholder, since native maps only work on a phone or emulator.
- **Android emulator:** install [Android Studio](https://developer.android.com/studio), create a device in *Device Manager*, start it, then press `a` in the Expo terminal.

The iOS Simulator needs a Mac, so on Windows use a real iPhone with Expo Go.

### 4. Getting updates later

```powershell
cd micro-bubbles
git pull
cd ui-prototype
npm install
npx expo start -c
```

`-c` clears Expo's cache so you don't see stale screens.

## Troubleshooting

- **"Project is incompatible with this version of Expo Go":** update Expo Go from the app store. The project uses Expo SDK 57.
- **Phone stuck on "Opening project…":** use `npx expo start --tunnel`.
- **Using WSL instead of PowerShell:** the steps are the same inside WSL, but phones usually can't reach a server running in WSL directly. Start with `npx expo start --tunnel`.
- **Blue gear button floating over the app:** that's Expo Go's developer menu, not part of the app. You can hide it in the Expo Go dev menu settings.
- **Reduced motion:** the app follows the phone's accessibility setting. You can override it in Profile → Settings.
