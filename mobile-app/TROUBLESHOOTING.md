# Troubleshooting - Expo Go Loading Issue

## Common Issues and Solutions

### 1. App Stuck on Loading Screen

**Possible Causes:**
- Missing dependencies
- Import errors
- Socket.IO connection blocking
- Asset references that don't exist

**Solutions:**

#### Clear Cache and Restart
```bash
cd mobile-app
npm start -- --clear
```

#### Check for Import Errors
Look at the Expo terminal output for any red error messages. Common issues:
- Missing module errors
- Syntax errors
- Import path errors

#### Disable Socket.IO Temporarily
If Socket.IO is causing issues, you can temporarily comment out socket initialization in `App.js`:

```javascript
// Comment out this line temporarily
// initSocket().catch(err => { ... });
```

### 2. Network Connection Issues

**Problem:** App can't connect to backend API

**Solution:**
- Update `services/api.js` with your computer's IP address instead of `localhost`
- Example: `http://192.168.1.100:3000/api`
- Make sure your phone and computer are on the same network
- Check firewall settings

### 3. Socket.IO Connection Errors

**Problem:** Socket.IO keeps trying to connect and blocks the app

**Solution:**
- The socket initialization is now non-blocking (won't crash the app)
- Check `services/socket.js` - it returns `null` if connection fails
- Update `SOCKET_URL` with your backend URL

### 4. Missing Assets

**Problem:** App references assets that don't exist

**Solution:**
- Already fixed in `app.json` - removed icon/splash image references
- App will use default Expo splash screen

### 5. Metro Bundler Issues

**Problem:** Metro bundler not starting or showing errors

**Solution:**
```bash
cd mobile-app
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### 6. Check Console Logs

**In Expo Go:**
- Shake your device to open developer menu
- Select "Show Dev Menu"
- Check "Debug Remote JS" to see console logs

**In Terminal:**
- Check the terminal where `npm start` is running
- Look for red error messages
- Check for any module resolution errors

### 7. Quick Debug Steps

1. **Check if app.json is valid:**
   ```bash
   cat mobile-app/app.json | jq .
   ```

2. **Verify entry point:**
   - Check `package.json` has `"main": "node_modules/expo/AppEntry.js"`

3. **Test with minimal app:**
   - Temporarily replace `App.js` with:
   ```javascript
   import { View, Text } from 'react-native';
   export default function App() {
     return <View><Text>Hello World</Text></View>;
   }
   ```
   - If this works, the issue is in your code
   - If this doesn't work, it's an Expo/configuration issue

### 8. Reinstall Dependencies

```bash
cd mobile-app
rm -rf node_modules package-lock.json
npm install
npm start -- --clear
```

### 9. Check Expo Version Compatibility

Make sure Expo SDK version matches:
- `expo`: ~49.0.0
- `react-native`: 0.72.10
- Check Expo Go app version on your phone matches SDK version

### 10. Network Configuration

**For Local Development:**
- Use your computer's local IP address (not localhost)
- Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Update `services/api.js` and `services/socket.js` with IP address
- Example: `http://192.168.1.100:3000`

## Still Not Working?

1. Check Expo terminal for specific error messages
2. Try running on a different device/emulator
3. Check if backend API is running and accessible
4. Verify all environment variables are set correctly
5. Check React Native and Expo versions compatibility

## Getting Help

When asking for help, provide:
- Expo terminal output (full error messages)
- Device/emulator type (iOS/Android)
- Expo Go version
- Node.js version
- Any red error messages from console

