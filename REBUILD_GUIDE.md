# App Rebuild Guide

This guide will help you rebuild the dealer portal application to ensure everything functions properly.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- For mobile app: Expo CLI and EAS CLI (if building APK)

## Step 1: Clean Install Dependencies

### Frontend (Web App)

```bash
# Navigate to root directory
cd C:\Users\Admin\dealer-portal-react

# Remove node_modules and lock files
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Install dependencies
npm install
```

### Mobile App

```bash
# Navigate to mobile app directory
cd mobile-app

# Remove node_modules and lock files
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Install dependencies
npm install
```

## Step 2: Environment Configuration

### Frontend Environment

Create a `.env` file in the root directory:

```env
# Frontend Environment Variables
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

**Note:** For production, update these URLs to your backend server URL.

### Mobile App Environment

The mobile app uses environment variables set in `eas.json` for builds, or reads from `utils/config.js` for development.

For development, update `mobile-app/utils/config.js` with your local IP address if testing on a physical device.

For production builds, update `mobile-app/eas.json`:

```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-backend-url.com/api",
        "EXPO_PUBLIC_SOCKET_URL": "https://your-backend-url.com"
      }
    }
  }
}
```

## Step 3: Verify Configuration

### Frontend API Configuration

Check `src/services/api.js` - it should read from `VITE_API_URL` environment variable with fallback to `http://localhost:3000/api`.

### Mobile App API Configuration

Check `mobile-app/utils/config.js` - it should:
- Read from `EXPO_PUBLIC_API_URL` environment variable for production builds
- Fall back to localhost for web or local IP for mobile development

## Step 4: Build and Test

### Frontend (Web App)

```bash
# Development mode
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

The app should start at `http://localhost:5173`

### Mobile App

```bash
cd mobile-app

# Start Expo development server
npm start

# For Android (requires Android Studio/emulator or physical device)
npm run android

# For iOS (requires Xcode/Mac)
npm run ios

# Build APK (requires EAS account)
eas build --platform android --profile preview
```

## Step 5: Common Issues and Fixes

### Issue: API Connection Errors

**Symptoms:** Network errors, 404s, or connection refused

**Solutions:**
1. Ensure backend server is running on port 3000
2. Check `.env` file has correct `VITE_API_URL`
3. For mobile app, ensure device and computer are on same network
4. Check firewall settings

### Issue: Mobile App Can't Connect to Backend

**Symptoms:** Login fails, API calls timeout

**Solutions:**
1. Update `mobile-app/utils/config.js` with your computer's local IP address
2. Ensure backend CORS allows mobile app origin
3. Check backend is accessible from mobile device's network

### Issue: Location Tracking Not Working

**Symptoms:** Location updates not sent, background tracking stops

**Solutions:**
1. Ensure location permissions are granted (foreground and background)
2. For Android: Check battery optimization is disabled for the app
3. For iOS: Ensure "Always Allow" location permission is granted
4. Verify `expo-task-manager` and `expo-location` are properly installed
5. Rebuild native app: `npx expo run:android` or `npx expo run:ios`

### Issue: Build Errors

**Symptoms:** npm install fails, build fails

**Solutions:**
1. Clear npm cache: `npm cache clean --force`
2. Delete `node_modules` and `package-lock.json`
3. Reinstall: `npm install`
4. For mobile app, ensure Expo SDK version matches dependencies

## Step 6: Verify Functionality

### Frontend Checklist

- [ ] App starts without errors
- [ ] Login page loads
- [ ] Can login with credentials
- [ ] OTP verification works
- [ ] Dashboard loads based on role
- [ ] API calls succeed (check Network tab)
- [ ] No console errors

### Mobile App Checklist

- [ ] App starts without errors
- [ ] Login screen loads
- [ ] Can login with credentials
- [ ] OTP verification works
- [ ] Dashboard loads assignments
- [ ] Location tracking starts automatically
- [ ] Location updates are sent every 10 seconds
- [ ] Background tracking continues when app is closed

## Troubleshooting Commands

### Clear All Caches

**Frontend:**
```bash
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm cache clean --force
npm install
```

**Mobile App:**
```bash
cd mobile-app
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npx expo start --clear
```

### Check Dependencies

```bash
# Frontend
npm list --depth=0

# Mobile App
cd mobile-app
npm list --depth=0
```

### Verify Environment Variables

**Frontend:**
```bash
# Check if .env file exists
Test-Path .env

# View .env contents (be careful with sensitive data)
Get-Content .env
```

**Mobile App:**
```bash
cd mobile-app
# Check config.js
Get-Content utils/config.js
```

## Next Steps

After rebuilding:

1. **Test Authentication:** Login and verify OTP flow works
2. **Test API Calls:** Check Network tab for successful API requests
3. **Test Location Tracking:** For mobile app, verify location updates are sent
4. **Test Real-time Features:** Verify Socket.IO connections work
5. **Test Role-based Access:** Login as different roles and verify correct dashboards

## Support

If issues persist:

1. Check browser/device console for errors
2. Check backend server logs
3. Verify backend is running and accessible
4. Check network connectivity
5. Review recent changes in git history

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")

