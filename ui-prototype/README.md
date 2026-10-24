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

## Requirements

| Tool | Version | Why |
|---|---|---|
| Node.js | 22.13 or newer (22 LTS or 24 LTS) | Required by Expo SDK 58 and React Native 0.88; Node 20 is too old |
| npm **or** pnpm | npm 10+ (comes with Node) or pnpm 9+ | Either one works, see below |
| Expo Go | SDK 58 | The latest Expo Go from the App Store or Google Play |

The required package versions are the same for npm and pnpm, because both read the same `package.json`. The difference is how exact they are:

- **pnpm** installs the exact versions recorded in `pnpm-lock.yaml`, the versions the prototype was tested with.
- **npm** has no lockfile here, so it picks the newest version that `package.json` allows. Expo packages use `~` ranges, so npm may get a newer bug-fix release (for example `expo` 58.0.20 instead of 58.0.19), but always the same SDK 58. Packages pinned to one version (`react`, `react-native`, `react-native-maps`, `react-native-svg`) are identical either way.

Both have been checked to install, pass the checks and run in Expo Go without errors, including the maps and the SVG bubbles.

## Run it

### 1. Install the tools (one time)

**Windows**, in PowerShell:

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
```

**Mac**, with [Homebrew](https://brew.sh):

```bash
brew install node git
```

Close and reopen the terminal, then check:

```bash
node -v
git --version
```

`node -v` should print `v22.13` or newer.

Optional, for exact versions: `npm install -g pnpm`.

### 2. Get the code (one time)

```bash
git clone https://github.com/gcc-capstone/micro-bubbles.git
cd micro-bubbles
git checkout setup/ui-prototype
cd ui-prototype
```

Then install with **one** of these:

```bash
pnpm install
```

```bash
npm install
```

Stick with the one you picked. Don't commit a `package-lock.json`: two lockfiles confuse Expo's tools. To add a package, use `npx expo install <package> --pnpm` (or without `--pnpm` for npm), so Expo picks the version that matches SDK 58.

### 3. Start it

```bash
npx expo start
```

A QR code appears in the terminal. Pick one way to view the app:

- **On your phone (recommended, real maps):** install **Expo Go** from the App Store or Google Play. Connect the phone to the same Wi-Fi as your computer, then scan the QR code (iPhone: Camera app; Android: inside Expo Go).
  - If Windows asks whether Node.js can use the network, click **Allow** (private networks).
  - If the phone can't connect (common on school or public Wi-Fi), stop with `Ctrl+C` and run `npx expo start --tunnel` instead.
- **In a browser:** press `w`. Good for quick layout checks, but the map is a drawn placeholder, since native maps only work on a phone or emulator.
- **iOS Simulator (Mac only):** install Xcode, then press `i`.
- **Android emulator:** install [Android Studio](https://developer.android.com/studio), create a device in *Device Manager*, start it, then press `a` in the Expo terminal.

### 4. Getting updates later

```bash
cd micro-bubbles
git pull
cd ui-prototype
pnpm install    # or: npm install
npx expo start -c
```

`-c` clears Expo's cache so you don't see stale screens.

### 5. Checks

```bash
npm run check
```

(or `pnpm run check`) runs the TypeScript check and the map, cluster and calendar math checks. `npx expo-doctor` checks that the installed packages match Expo SDK 58.

## Troubleshooting

- **"Project is incompatible with this version of Expo Go":** update Expo Go from the app store. The project uses Expo SDK 58.
- **Phone stuck on "Opening project…":** use `npx expo start --tunnel`.
- **`EBADENGINE` warnings or Expo failing to start:** your Node is too old. Install Node 22.13 or newer, delete `node_modules`, and install again.
- **Using WSL instead of PowerShell:** the steps are the same inside WSL, but phones usually can't reach a server running in WSL directly. Start with `npx expo start --tunnel`.
- **Blue gear button floating over the app:** that's Expo Go's developer menu, not part of the app. You can hide it in the Expo Go dev menu settings.
- **Reduced motion:** the app follows the phone's accessibility setting. You can override it in Profile → Settings.
