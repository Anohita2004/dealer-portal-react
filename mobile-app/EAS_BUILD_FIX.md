# Fix: EAS Build Error - Wrong Directory

## Problem
You're running `eas build` from the **root directory** instead of the **mobile-app directory**.

## Solution

### Step 1: Navigate to Mobile App Directory
```bash
cd mobile-app
```

### Step 2: Verify You're in the Right Place
You should see `package.json`, `app.json`, and `App.js` files.

### Step 3: Run Build Command Again
```bash
eas build --profile development --platform android
```

## Complete Correct Sequence

```bash
# 1. Navigate to mobile-app directory
cd mobile-app

# 2. Verify expo is installed (should already be there)
npm list expo

# 3. Install expo-dev-client if needed
npx expo install expo-dev-client

# 4. Run build
eas build --profile development --platform android
```

## Why This Happened

- ✅ EAS project was created correctly
- ✅ Configuration was successful
- ❌ Build command was run from wrong directory
- ❌ Root directory doesn't have `expo` package

## Quick Fix

Just run:
```bash
cd mobile-app
eas build --profile development --platform android
```

The build should work now!

