# Background Location Tracking Solution

## Problem Solved

The app was not tracking location when closed or in the background. The previous solution using `setInterval` was being throttled by the OS when the app went to background.

## Solution Implemented

We've implemented **`expo-task-manager`** with **`Location.startLocationUpdatesAsync`** for true background location tracking. This runs independently of the app state and continues working even when the app is completely closed.

## How It Works

### 1. Background Location Task (`tasks/locationTask.js`)

- Defined a background task that runs independently
- Receives location updates from the OS
- Sends location updates to the server via API
- Works even when app is closed

### 2. Updated Location Service (`services/driverLocationService.js`)

- Starts background location task when tracking begins
- Also uses `watchPositionAsync` for foreground (faster, more responsive)
- Stores tracking data in AsyncStorage for background task access
- Properly stops background task when tracking stops

### 3. App Configuration (`app.json`)

- Added required Android permissions:
  - `FOREGROUND_SERVICE`
  - `FOREGROUND_SERVICE_LOCATION`
- iOS background modes already configured

## Key Features

✅ **True Background Tracking** - Works even when app is completely closed  
✅ **Persistent Notification** - Android shows "Location Tracking Active" notification  
✅ **Automatic Start** - Tracking starts automatically when assignment loads  
✅ **Rate Limited** - Respects 10-second rate limit  
✅ **Error Handling** - Retries failed API calls  

## Installation Steps

1. **Install dependencies**:
   ```bash
   cd mobile-app
   npm install
   ```

2. **Rebuild the app** (required for native changes):
   ```bash
   # For development
   npx expo run:android
   
   # Or build APK (see BUILD_APK_GUIDE.md)
   eas build --platform android --profile preview
   ```

## Testing

1. **Install the app** on a device
2. **Login as driver**
3. **Grant location permissions** - Select "Allow all the time" (not "While using app")
4. **Start tracking** - Should happen automatically when assignment loads
5. **Close the app completely** - Swipe away from recent apps
6. **Check web dashboard** - Location should continue updating every 10 seconds
7. **Check Android notification** - Should see "Location Tracking Active"

## Important Notes

### Permissions

- **Android**: Must grant "Allow all the time" location permission
- **iOS**: Must grant "Always Allow" location permission
- **Battery Optimization**: Disable battery optimization for the app (Android)

### Background Task Limitations

- Background task runs independently but still requires:
  - Location permissions granted
  - Battery optimization disabled
  - Network connectivity

### Debugging

Check console logs for:
- `✅ Background location task started successfully`
- `📍 Background location received`
- `✅ Background location sent successfully`

If you see errors:
- Check location permissions
- Verify network connectivity
- Check API endpoint is accessible

## Files Changed

1. `tasks/locationTask.js` - NEW: Background location task definition
2. `services/driverLocationService.js` - Updated to use background task
3. `App.js` - Import location task to register it
4. `app.json` - Added Android foreground service permissions
5. `package.json` - Added `expo-task-manager` dependency

## Next Steps

1. **Test thoroughly** - Verify background tracking works
2. **Build APK** - Follow `BUILD_APK_GUIDE.md`
3. **Deploy** - Install APK on driver devices
4. **Monitor** - Check web dashboard for location updates

## Troubleshooting

### Background task not starting
- Check `expo-task-manager` is installed
- Verify location permissions are granted
- Rebuild the app (native changes require rebuild)

### Location updates stop
- Check console logs for errors
- Verify background location permission is "Allow all the time"
- Disable battery optimization
- Restart the app

### APK build fails
- Check `BUILD_APK_GUIDE.md`
- Verify all dependencies are installed
- Check EAS account is logged in

