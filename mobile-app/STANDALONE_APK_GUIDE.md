# Building Standalone APK (No WiFi Required)

This guide explains how to build a **standalone APK** that works independently without requiring the same WiFi network or Expo Go.

## Problem with Expo Go

- ❌ Requires same WiFi network
- ❌ Requires Expo Go app installed
- ❌ Not suitable for production
- ❌ Limited native module support

## Solution: Standalone APK

- ✅ Works independently (no WiFi requirement)
- ✅ No Expo Go needed
- ✅ Full native module support
- ✅ Production-ready
- ✅ Can be distributed via APK file

## Prerequisites

1. **Public Server URL**: Your backend API must be accessible over the internet
   - Example: `https://api.yourdomain.com`
   - NOT: `http://localhost:3000` or `http://192.168.x.x:3000`

2. **EAS Account**: Free account at https://expo.dev

3. **EAS CLI**: `npm install -g eas-cli`

## Step 1: Configure Your Server URL

### Option A: Update eas.json (Recommended)

Edit `mobile-app/eas.json` and replace `yourdomain.com` with your actual server URL:

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

### Option B: Use Environment Variables

Create a `.env` file in `mobile-app/` directory:

```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
EXPO_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

Then update `eas.json` to use the variables (already configured).

## Step 2: Ensure Your Backend is Publicly Accessible

Your backend server must be:
- ✅ Deployed to a public server (not localhost)
- ✅ Accessible via HTTPS (recommended) or HTTP
- ✅ CORS configured to allow mobile app requests
- ✅ Socket.IO configured for your domain

### Example Backend Setup

If your backend is at `https://api.yourdomain.com`:
- API endpoints: `https://api.yourdomain.com/api/*`
- Socket.IO: `https://api.yourdomain.com`

## Step 3: Build Standalone APK

```bash
cd mobile-app

# Login to Expo (if not already)
eas login

# Build APK with your server URL
eas build --platform android --profile preview
```

The build will:
1. Create a standalone Android app
2. Include all native modules (expo-task-manager, etc.)
3. Embed your server URL from environment variables
4. Generate an APK file

## Step 4: Download and Install APK

1. **Get download link** from build output or Expo dashboard
2. **Download APK** to your computer
3. **Transfer to Android device** (USB, email, cloud storage)
4. **Install APK**:
   - Enable "Install from Unknown Sources" in Android settings
   - Tap the APK file to install
5. **Grant permissions**:
   - Location: "Allow all the time"
   - Disable battery optimization

## Step 5: Test Standalone App

1. **Open the app** (no Expo Go needed!)
2. **Login** - should connect to your public server
3. **Test location tracking** - should work even when app is closed
4. **Verify** - works on any WiFi network or mobile data

## Configuration Files

### eas.json
- Contains build profiles
- Environment variables for API URLs
- Build type (APK vs AAB)

### app.json
- App metadata (name, package, version)
- Permissions
- Native module configuration

### utils/config.js
- Reads environment variables
- Falls back to defaults for development
- Logs configuration for debugging

## Environment Variables

The app uses these environment variables (set in `eas.json`):

- `EXPO_PUBLIC_API_URL` - Your backend API URL
- `EXPO_PUBLIC_SOCKET_URL` - Your Socket.IO server URL

These are embedded into the APK during build, so the app knows where to connect.

## Development vs Production

### Development (Expo Go - Same WiFi)
- Uses local IP: `http://192.168.x.x:3000`
- Requires same WiFi network
- Good for testing during development

### Production (Standalone APK)
- Uses public URL: `https://api.yourdomain.com`
- Works anywhere (WiFi or mobile data)
- No WiFi requirement
- Suitable for distribution

## Troubleshooting

### APK Can't Connect to Server

1. **Check server URL** in `eas.json`:
   ```json
   "EXPO_PUBLIC_API_URL": "https://api.yourdomain.com/api"
   ```

2. **Verify server is accessible**:
   ```bash
   curl https://api.yourdomain.com/api/health
   ```

3. **Check CORS** on your backend allows mobile app

4. **Rebuild APK** with correct URL:
   ```bash
   eas build --platform android --profile preview
   ```

### Still Using Local IP

- Environment variables are embedded at build time
- You MUST rebuild APK after changing URLs
- Old APK will still have old URL

### Background Tracking Not Working

- Ensure `expo-task-manager` is included (it is)
- Grant "Allow all the time" location permission
- Disable battery optimization
- Check console logs for errors

## Quick Reference

```bash
# Build standalone APK
eas build --platform android --profile preview

# Check build status
eas build:list

# View build logs
eas build:view [build-id]
```

## Next Steps

1. ✅ Configure your public server URL in `eas.json`
2. ✅ Ensure backend is publicly accessible
3. ✅ Build APK: `eas build --platform android --profile preview`
4. ✅ Download and install APK
5. ✅ Test on device (any network)
6. ✅ Distribute APK to drivers

## Important Notes

- **Standalone APK is NOT Expo Go** - it's a real Android app
- **No WiFi requirement** - works on any network
- **Server URL is embedded** - set it before building
- **Rebuild required** - if you change server URL, rebuild APK
- **Native modules work** - expo-task-manager, location, etc.

