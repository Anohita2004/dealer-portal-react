# Alternatives to Expo Go - Testing GPS Functionality

Since Expo Go isn't working, here are **better alternatives** to test GPS functionality:

---

## Option 1: Test GPS on Web Browser First (Easiest) ⭐

**Why**: Browser Geolocation API works similarly to mobile GPS and you can test immediately.

### Setup

1. **Update locationTracker.js for Web Support**:
   - Already supports web via `expo-location` (works in browser too)
   - Or use browser's native Geolocation API

2. **Test in Browser**:
   ```bash
   cd mobile-app
   npm start
   # Press 'w' for web
   ```

3. **Enable Location in Browser**:
   - Chrome: Settings → Privacy → Site Settings → Location → Allow
   - Or click the location icon in address bar when prompted

### Advantages
- ✅ Works immediately (no setup)
- ✅ Same API as mobile (`expo-location` works on web)
- ✅ Easy debugging with browser DevTools
- ✅ Can test all GPS features

### Test GPS Code
The existing `locationTracker.js` already works on web! Just test it.

---

## Option 2: Expo Development Build (Recommended) ⭐⭐⭐

**Why**: Better than Expo Go - custom development client with full native features.

### Setup Steps

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure Project**:
   ```bash
   cd mobile-app
   eas build:configure
   ```

4. **Create Development Build**:
   ```bash
   # For Android
   eas build --profile development --platform android
   
   # For iOS (requires Apple Developer account)
   eas build --profile development --platform ios
   ```

5. **Install on Device**:
   - Download APK/IPA from Expo dashboard
   - Install on your phone
   - Run: `expo start --dev-client`

### Advantages
- ✅ Full native features (GPS works perfectly)
- ✅ No Expo Go limitations
- ✅ Can install on multiple devices
- ✅ Works offline after initial build

### Disadvantages
- ⚠️ Requires Expo account (free)
- ⚠️ First build takes 10-15 minutes
- ⚠️ iOS requires Apple Developer account ($99/year)

---

## Option 3: React Native CLI (Full Native) ⭐⭐

**Why**: Complete control, no Expo limitations.

### Setup Steps

1. **Install React Native CLI**:
   ```bash
   npm install -g react-native-cli
   ```

2. **Install Android Studio** (for Android):
   - Download: https://developer.android.com/studio
   - Install Android SDK
   - Set up Android Virtual Device (AVD)

3. **Create New Project**:
   ```bash
   npx react-native init DealerPortalMobile --version 0.81.5
   ```

4. **Copy Your Code**:
   - Copy `src/`, `services/`, `screens/` folders
   - Copy `package.json` dependencies
   - Update imports as needed

5. **Install Dependencies**:
   ```bash
   npm install
   npm install @react-native-async-storage/async-storage
   npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
   npm install react-native-gesture-handler react-native-screens react-native-safe-area-context
   npm install axios socket.io-client
   ```

6. **For GPS**:
   ```bash
   npm install @react-native-community/geolocation
   # Or use react-native-geolocation-service
   ```

7. **Run on Android**:
   ```bash
   npx react-native run-android
   ```

### Advantages
- ✅ Full control
- ✅ No Expo limitations
- ✅ Can use any native module
- ✅ Better performance

### Disadvantages
- ⚠️ More complex setup
- ⚠️ Need to configure native code
- ⚠️ Longer build times

---

## Option 4: Android Emulator (No Physical Device Needed) ⭐⭐

**Why**: Test GPS without a physical phone.

### Setup Steps

1. **Install Android Studio**:
   - Download: https://developer.android.com/studio

2. **Create Virtual Device**:
   - Open Android Studio → AVD Manager
   - Create new virtual device
   - Choose device (e.g., Pixel 5)
   - Download system image

3. **Start Emulator**:
   ```bash
   # Start emulator from Android Studio
   # Or command line:
   emulator -avd Pixel_5_API_33
   ```

4. **Simulate GPS Location**:
   - In emulator: Click "..." (three dots) → Location
   - Set GPS coordinates manually
   - Or use GPX files for routes

5. **Run Expo/React Native**:
   ```bash
   # Expo
   expo start
   # Press 'a' for Android
   
   # Or React Native CLI
   npx react-native run-android
   ```

### Advantages
- ✅ No physical device needed
- ✅ Can simulate any location
- ✅ Easy to test edge cases
- ✅ Can record GPS routes

### Disadvantages
- ⚠️ Requires Android Studio (large download)
- ⚠️ Slower than physical device
- ⚠️ GPS simulation not as accurate

---

## Option 5: Physical Device via USB (Direct Connection) ⭐⭐⭐

**Why**: Fastest way to test on real device.

### Android Setup

1. **Enable Developer Options**:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Go back → Developer Options → Enable USB Debugging

2. **Connect Phone**:
   ```bash
   # Connect via USB
   # Verify connection
   adb devices
   ```

3. **Run App**:
   ```bash
   cd mobile-app
   expo start
   # Press 'a' for Android
   # Or use React Native CLI
   npx react-native run-android
   ```

### iOS Setup (Mac Only)

1. **Install Xcode**:
   - Download from App Store (large, ~10GB)

2. **Connect iPhone**:
   - Trust computer on iPhone
   - Open Xcode → Window → Devices and Simulators

3. **Run App**:
   ```bash
   cd mobile-app
   expo start
   # Press 'i' for iOS
   ```

### Advantages
- ✅ Real device testing
- ✅ Actual GPS accuracy
- ✅ Fast iteration
- ✅ Can test all sensors

### Disadvantages
- ⚠️ Requires USB cable
- ⚠️ iOS requires Mac + Xcode
- ⚠️ Need to trust computer

---

## Option 6: Test GPS Code on Web First (Quickest) ⭐⭐⭐

**Create a simple GPS test page** to verify your code works:

### Create `mobile-app/test-gps.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>GPS Test</title>
</head>
<body>
    <h1>GPS Location Test</h1>
    <button onclick="startTracking()">Start GPS Tracking</button>
    <button onclick="stopTracking()">Stop Tracking</button>
    <div id="status"></div>
    <div id="location"></div>

    <script>
        let watchId = null;

        function startTracking() {
            if (navigator.geolocation) {
                watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude, accuracy, speed, heading } = position.coords;
                        document.getElementById('location').innerHTML = `
                            <h3>Location:</h3>
                            <p>Lat: ${latitude.toFixed(6)}</p>
                            <p>Lng: ${longitude.toFixed(6)}</p>
                            <p>Accuracy: ${accuracy}m</p>
                            <p>Speed: ${speed ? (speed * 3.6).toFixed(2) : 'N/A'} km/h</p>
                            <p>Heading: ${heading || 'N/A'}°</p>
                            <p>Time: ${new Date(position.timestamp).toLocaleTimeString()}</p>
                        `;
                    },
                    (error) => {
                        document.getElementById('status').innerHTML = `Error: ${error.message}`;
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );
                document.getElementById('status').innerHTML = 'GPS Tracking Started';
            } else {
                document.getElementById('status').innerHTML = 'Geolocation not supported';
            }
        }

        function stopTracking() {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
                document.getElementById('status').innerHTML = 'GPS Tracking Stopped';
            }
        }
    </script>
</body>
</html>
```

**Test it**:
1. Open `test-gps.html` in browser
2. Click "Start GPS Tracking"
3. Allow location access
4. See your location update

This verifies GPS code works before testing on mobile!

---

## Recommended Approach

### For Quick Testing (Today):
1. ✅ **Test GPS on Web** (Option 1 or 6)
2. ✅ **Use Android Emulator** (Option 4) if you have Android Studio

### For Production Development:
1. ✅ **Expo Development Build** (Option 2) - Best balance
2. ✅ **Physical Device via USB** (Option 5) - Fastest iteration

### For Full Control:
1. ✅ **React Native CLI** (Option 3) - Most flexible

---

## Quick Start: Test GPS on Web Right Now

Your `expo-location` already works on web! Just:

```bash
cd mobile-app
npm start
# Press 'w' for web
# Allow location access when prompted
# Test GPS tracking!
```

The `LocationTracker` class will work exactly the same on web as mobile!

---

## Need Help?

- **Expo Development Build**: https://docs.expo.dev/development/introduction/
- **React Native CLI**: https://reactnative.dev/docs/environment-setup
- **Android Emulator**: https://developer.android.com/studio/run/emulator
- **Browser Geolocation**: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API

