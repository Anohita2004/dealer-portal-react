# Building APK for Dealer Portal Mobile App

This guide will help you build a **standalone APK** file that can be installed independently on Android devices **without requiring Expo Go or the same WiFi network**.

> **Important**: For a standalone APK that works on any network (not just same WiFi), see `STANDALONE_APK_GUIDE.md` for complete instructions including server URL configuration.

## Prerequisites

1. **EAS CLI** (Expo Application Services)
   ```bash
   npm install -g eas-cli
   ```

2. **Expo Account** (free account works)
   - Sign up at https://expo.dev
   - Login: `eas login`

3. **Android Keystore** (for production builds)
   - EAS can generate this automatically, or you can provide your own

## Step 1: Install Dependencies

```bash
cd mobile-app
npm install
```

This will install `expo-task-manager` and other required dependencies.

## Step 2: Configure EAS Build

The `eas.json` file is already configured. You can review it:

```json
{
  "build": {
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

## Step 3: Configure Server URL (IMPORTANT!)

**Before building**, update `eas.json` with your public server URL:

```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.yourdomain.com/api",
        "EXPO_PUBLIC_SOCKET_URL": "https://api.yourdomain.com"
      }
    }
  }
}
```

Replace `yourdomain.com` with your actual server domain. This ensures the APK works on any network, not just same WiFi.

## Step 4: Build APK

### Option A: Preview Build (Recommended for Testing)

```bash
eas build --platform android --profile preview
```

This creates a **standalone APK** that can be installed directly on devices and works independently.

### Option B: Production Build

```bash
eas build --platform android --profile production
```

This creates an AAB (Android App Bundle) for Google Play Store, or APK if configured.

## Step 5: Download APK

After the build completes:

1. You'll get a URL in the terminal
2. Visit the URL or check your Expo dashboard: https://expo.dev/accounts/[your-account]/projects/dealer-portal-react/builds
3. Download the APK file

## Step 6: Install APK

1. Transfer the APK to your Android device
2. Enable "Install from Unknown Sources" in Android settings
3. Tap the APK file to install
4. Open the app and grant location permissions

## Alternative: Local Build (Advanced)

If you want to build locally without EAS:

```bash
# Install Android build tools
npx expo install expo-dev-client

# Build APK locally (requires Android Studio)
eas build --platform android --profile preview --local
```

## Important Notes

### Background Location Tracking

The app uses `expo-task-manager` for true background location tracking. This means:

1. **Location tracking continues even when app is closed**
2. **Android shows a persistent notification** ("Location Tracking Active")
3. **User must grant "Allow all the time" location permission**

### Permissions Required

- `ACCESS_FINE_LOCATION` - For precise location
- `ACCESS_BACKGROUND_LOCATION` - For background tracking
- `FOREGROUND_SERVICE` - For Android foreground service
- `FOREGROUND_SERVICE_LOCATION` - For location foreground service

### Testing Background Tracking

1. Install the APK on a device
2. Login as a driver
3. Start tracking (should happen automatically when assignment loads)
4. **Close the app completely** (swipe away from recent apps)
5. Check the web dashboard - location should continue updating every 10 seconds
6. You should see a persistent notification on Android

## Troubleshooting

### Build Fails

- Check that all dependencies are installed: `npm install`
- Verify `eas.json` is correct
- Check Expo account is logged in: `eas whoami`

### APK Won't Install

- Enable "Install from Unknown Sources" in Android settings
- Check Android version compatibility (minimum Android 6.0)

### Background Tracking Not Working

- Grant "Allow all the time" location permission (not "While using app")
- Disable battery optimization for the app
- Check that notification is showing (Android)

### Location Updates Stop

- Check console logs for errors
- Verify background location permission is granted
- Restart the app and grant permissions again

## Build Configuration Files

- `app.json` - App configuration (package name, permissions, etc.)
- `eas.json` - Build profiles and settings
- `package.json` - Dependencies

## Next Steps

After building and testing:

1. Test background tracking thoroughly
2. Verify location updates continue when app is closed
3. Check web dashboard shows live updates
4. Consider setting up Google Play Store distribution for easier updates

## Support

For build issues:
- EAS Build docs: https://docs.expo.dev/build/introduction/
- Expo Discord: https://chat.expo.dev/

