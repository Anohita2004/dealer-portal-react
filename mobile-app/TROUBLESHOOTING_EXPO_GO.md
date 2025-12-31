# Troubleshooting Expo Go Loading Issues

## Problem: App Stuck on Loading Screen

If the app is stuck on the loading screen in Expo Go but works in the web browser, follow these steps:

### 1. Check Network Configuration

**Issue**: The app can't connect to the backend server.

**Solution**:
- Make sure your phone and computer are on the **same Wi-Fi network**
- Verify the IP address in `mobile-app/services/api.js` and `mobile-app/services/socket.js`
- The IP should be your computer's local IP (not `localhost` or `127.0.0.1`)

**To find your IP address**:
- **Windows**: Open Command Prompt and run `ipconfig`, look for IPv4 Address
- **Mac/Linux**: Open Terminal and run `ifconfig | grep inet` or `ip addr show`

**Example**:
```javascript
// In mobile-app/services/api.js
const API_BASE_URL = 'http://192.168.1.100:3000/api'; // Use YOUR computer's IP

// In mobile-app/services/socket.js
const SOCKET_URL = 'http://192.168.1.100:3000'; // Use YOUR computer's IP
```

### 2. Check Backend Server

**Issue**: Backend server is not running or not accessible.

**Solution**:
- Make sure the backend server is running on port 3000
- Test the connection from your phone's browser: `http://YOUR_IP:3000/api/health` (if health endpoint exists)
- Check firewall settings - port 3000 should be open

### 3. Check Expo Go Connection

**Issue**: Expo Go can't connect to the development server.

**Solution**:
- Make sure Expo CLI is running: `npm start` or `expo start`
- Try scanning the QR code again
- Check if you're using the correct Expo Go app version
- Try clearing Expo Go cache: Settings → Clear Cache

### 4. Check Console Logs

**Issue**: Errors are being silently swallowed.

**Solution**:
- Open the Expo DevTools (press `d` in the terminal or shake your device)
- Check the console for errors
- Look for network errors, connection timeouts, or authentication errors

### 5. Check Authentication Token

**Issue**: Token might be invalid or expired.

**Solution**:
- Clear app data: In Expo Go, shake device → "Reload" or "Clear AsyncStorage"
- Try logging in again
- Check if token is being stored: Look for `AsyncStorage` logs

### 6. Check Socket.IO Connection

**Issue**: Socket.IO connection might be blocking the app.

**Solution**:
- Socket initialization is now non-blocking (updated in latest code)
- Check socket connection logs in console
- If socket fails, the app should still work (socket is optional for initial load)

### 7. Common Fixes

#### Fix 1: Restart Everything
```bash
# Stop Expo
Ctrl+C

# Clear Expo cache
expo start --clear

# Restart backend server
# Then restart Expo
```

#### Fix 2: Use Tunnel Mode (if LAN doesn't work)
```bash
expo start --tunnel
```

#### Fix 3: Check Environment Variables
Make sure `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL` are set correctly in `.env` file (if using one).

#### Fix 4: Update Dependencies
```bash
cd mobile-app
npm install
```

### 8. Debug Steps

1. **Check Loading Timeout**:
   - The app now has a 5-second loading timeout
   - If it takes longer, check network connectivity

2. **Check Auth Check Interval**:
   - Reduced from 2 seconds to 5 seconds
   - Should reduce performance impact

3. **Check Socket Initialization**:
   - Socket now initializes in background (non-blocking)
   - App should load even if socket fails

### 9. Network Debugging

**Test API Connection**:
```bash
# From your phone's browser or using curl
curl http://YOUR_IP:3000/api/auth/login
```

**Test Socket Connection**:
- Check if Socket.IO is accessible
- Look for connection errors in backend logs

### 10. Still Not Working?

1. **Check Expo Go Version**:
   - Update Expo Go app on your phone
   - Make sure it matches your Expo SDK version (54.0.0)

2. **Check React Native Version**:
   - Make sure React Native version is compatible
   - Current: 0.81.5

3. **Check for Conflicts**:
   - Make sure no other apps are using port 3000
   - Check if antivirus/firewall is blocking connections

4. **Try Development Build**:
   - If Expo Go continues to have issues, consider creating a development build
   - `expo run:android` or `expo run:ios`

### 11. Quick Checklist

- [ ] Backend server is running
- [ ] Phone and computer on same Wi-Fi
- [ ] IP address is correct (not localhost)
- [ ] Port 3000 is accessible
- [ ] Expo Go app is updated
- [ ] No firewall blocking connections
- [ ] Console shows no errors
- [ ] Tried clearing cache
- [ ] Tried restarting everything

### 12. Error Messages to Look For

- **"Network Error"**: Backend not reachable
- **"ECONNREFUSED"**: Connection refused (server not running or wrong IP)
- **"Timeout"**: Request took too long (network issue)
- **"401 Unauthorized"**: Token invalid or expired
- **"404 Not Found"**: Endpoint doesn't exist

### 13. Contact Support

If none of these work, provide:
1. Console logs from Expo DevTools
2. Backend server logs
3. Network configuration (IP addresses)
4. Expo Go version
5. Device type (iOS/Android)

---

## Recent Fixes Applied

1. ✅ Made socket initialization non-blocking
2. ✅ Added loading timeout (5 seconds)
3. ✅ Reduced auth check frequency (5 seconds instead of 2)
4. ✅ Improved error handling
5. ✅ Added better logging
6. ✅ Made socket connection optional for initial load

These fixes should prevent the app from getting stuck on the loading screen.

