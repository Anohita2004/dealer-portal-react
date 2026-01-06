# Quick Start: Build Standalone APK (No WiFi Required)

## The Problem
- Expo Go requires same WiFi network ❌
- Not practical for production ❌

## The Solution
Build a **standalone APK** that works independently on any network ✅

## Quick Steps

### 1. Update Server URL in `eas.json`

Edit `mobile-app/eas.json` and replace `yourdomain.com`:

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

**Replace `yourdomain.com` with your actual server domain!**

### 2. Build APK

```bash
cd mobile-app
eas build --platform android --profile preview
```

### 3. Download & Install

1. Get download link from build output
2. Download APK
3. Install on Android device
4. Works on **any network** (WiFi or mobile data)!

## Key Points

✅ **Standalone APK** = Real Android app (not Expo Go)  
✅ **No WiFi requirement** - Works anywhere  
✅ **Server URL embedded** - Set it before building  
✅ **Full native support** - Background tracking works  

## Full Guide

See `STANDALONE_APK_GUIDE.md` for complete instructions.

