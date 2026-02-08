# Workout Time

A modern, fully functional React Native workout app built with Expo. Track your workouts, browse exercises, use a rest timer, and monitor your progress.

## Features

- **Home** – Quick stats, start workouts, view recent activity
- **Workouts** – 6 pre-built routines (Push, Pull, Legs, Full Body, Quick Upper, Core Focus)
- **Exercises** – 22 exercises with instructions, filterable by muscle group
- **Timer** – Customizable rest timer with presets (30s to 5 min)
- **Progress** – Workout history and stats (total workouts, this week, total time)

## Running the App

```bash
npm install
npm start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator (macOS only)
- Press `w` for web
- Scan the QR code with Expo Go on your device

## Publishing to Stores

### Prerequisites

- [EAS CLI](https://docs.expo.dev/build/setup/): `npm install -g eas-cli`
- Expo account: `eas login`
- Apple Developer account (for App Store)
- Google Play Developer account (for Play Store)

### Configure app.json

1. Update `ios.bundleIdentifier` and `android.package` to your unique ID (e.g. `com.yourcompany.workouttime` → `com.yourname.workouttime`).
2. Add your own app icon and splash screen assets.

### Build for production

```bash
# Configure EAS (first time)
eas build:configure

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

### Submit to stores

```bash
# Submit Android to Play Store
eas submit --platform android --latest

# Submit iOS to App Store
eas submit --platform ios --latest
```

See [Expo’s publishing guide](https://docs.expo.dev/submit/introduction/) for details.

## Tech Stack

- **React Native** + **Expo SDK 54**
- **Expo Router** – File-based navigation
- **AsyncStorage** – Workout history persistence
- **expo-haptics** – Haptic feedback
- **expo-linear-gradient** – UI gradients
- **react-native-reanimated** – Animations

## License

MIT
