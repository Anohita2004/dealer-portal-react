# Rebuild Instructions After Installing expo-task-manager

## Important: Native Module Installation

`expo-task-manager` is a **native module** that requires rebuilding the app. The package is now installed, but you need to rebuild.

## Steps to Fix

### Option 1: Development Build (Recommended for Testing)

1. **Clear Metro bundler cache**:
   ```bash
   npx expo start --clear
   ```

2. **Rebuild the native app**:
   ```bash
   # For Android
   npx expo run:android
   
   # For iOS (if needed)
   npx expo run:ios
   ```

   This will:
   - Rebuild the native Android/iOS code
   - Include the expo-task-manager native module
   - Install the app on your device/emulator

### Option 2: EAS Build (For APK)

If you're building an APK:

```bash
eas build --platform android --profile preview
```

This will create a new build with expo-task-manager included.

## Why Rebuild is Needed

Native modules like `expo-task-manager` require:
- Native Android/iOS code compilation
- Linking with native libraries
- Cannot be added with just `npm install`

## Verification

After rebuilding, you should see:
- ✅ No import errors for `expo-task-manager`
- ✅ App starts successfully
- ✅ Background location task can be started

## Troubleshooting

If you still see import errors after rebuilding:

1. **Clear all caches**:
   ```bash
   npx expo start --clear
   rm -rf node_modules
   npm install
   ```

2. **Verify package is installed**:
   ```bash
   npm list expo-task-manager
   ```
   Should show: `expo-task-manager@12.0.6`

3. **Check package.json**:
   Should have: `"expo-task-manager": "~12.0.3"`

4. **Rebuild again**:
   ```bash
   npx expo run:android
   ```

