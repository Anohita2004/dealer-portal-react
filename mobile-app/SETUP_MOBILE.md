# Mobile App Setup Guide

## Quick Fix: App Works on Web but Not Mobile

### The Problem
- **Web**: Works because browser uses `localhost` (same machine)
- **Mobile**: Needs your computer's **IP address** (different device on network)

### Solution: Update IP Address

1. **Find Your Computer's IP Address**:
   - **Windows**: Open Command Prompt → `ipconfig` → Look for "IPv4 Address"
   - **Mac/Linux**: Open Terminal → `ifconfig | grep inet` or `ip addr show`

2. **Update Configuration**:
   - Open `mobile-app/utils/config.js`
   - Find the line: `return 'http://192.168.29.61:3000/api';`
   - Replace `192.168.29.61` with **YOUR computer's IP address**

3. **Example**:
   ```javascript
   // If your IP is 192.168.1.100
   return 'http://192.168.1.100:3000/api';
   ```

4. **Restart Expo**:
   ```bash
   # Stop Expo (Ctrl+C)
   # Clear cache and restart
   expo start --clear
   ```

### Verify Configuration

The app will show debug info on error screens (development mode only):
- Platform: ios/android
- API URL: Shows current configuration
- Socket URL: Shows current configuration

### Common Issues

#### Issue 1: Wrong IP Address
**Symptom**: App stuck on loading or network errors

**Fix**: 
- Make sure IP address matches your computer's current IP
- IP can change when you reconnect to Wi-Fi
- Check IP again: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

#### Issue 2: Phone and Computer on Different Networks
**Symptom**: Cannot connect to server

**Fix**:
- Connect both devices to the **same Wi-Fi network**
- Mobile data won't work - must be same Wi-Fi

#### Issue 3: Firewall Blocking Connection
**Symptom**: Web works, mobile doesn't

**Fix**:
- Allow port 3000 in Windows Firewall
- Or temporarily disable firewall for testing

#### Issue 4: Backend Not Running
**Symptom**: Connection refused errors

**Fix**:
- Make sure backend server is running
- Test: Open `http://YOUR_IP:3000/api/health` in phone browser

### Testing Connection

1. **From Phone Browser**:
   - Open browser on phone
   - Go to: `http://YOUR_IP:3000/api/health`
   - Should see response (or error page, but connection works)

2. **From Expo Go**:
   - Check console logs for connection attempts
   - Look for `[API] Base URL:` and `[Socket] URL:` logs
   - Check error messages for network issues

### Platform Detection

The app automatically detects platform:
- **Web**: Uses `localhost:3000`
- **Mobile**: Uses your IP address (from config)

This is handled in `mobile-app/utils/config.js`

### Environment Variables (Optional)

You can also use environment variables:

1. Create `.env` file in `mobile-app/` directory:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
   EXPO_PUBLIC_SOCKET_URL=http://192.168.1.100:3000
   ```

2. Replace `192.168.1.100` with your IP

3. Restart Expo: `expo start --clear`

### Quick Checklist

- [ ] Backend server is running
- [ ] Phone and computer on same Wi-Fi
- [ ] IP address is correct in `config.js`
- [ ] Port 3000 is accessible
- [ ] Firewall allows connections
- [ ] Restarted Expo after config change

### Still Not Working?

1. **Check Console Logs**:
   - Look for `[App]`, `[API]`, `[Socket]` prefixed logs
   - Check for error messages

2. **Test Network**:
   - Try accessing API from phone browser
   - Check if backend responds

3. **Try Tunnel Mode**:
   ```bash
   expo start --tunnel
   ```
   - This uses Expo's servers (slower but works across networks)

4. **Check Backend CORS**:
   - Make sure backend allows requests from your phone's IP
   - Or allows all origins in development

---

## Summary

**Key Point**: Mobile devices need your computer's **IP address**, not `localhost`.

**Quick Fix**: Update `mobile-app/utils/config.js` with your current IP address.

**Test**: Try accessing `http://YOUR_IP:3000/api/health` from your phone's browser first.

