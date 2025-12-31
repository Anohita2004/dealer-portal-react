# EAS Build Setup Guide

## Current Step: Creating EAS Project

You're being asked to create an EAS project. **Answer "Y" (Yes)** to proceed.

### What This Does:
- Creates an EAS project linked to your Expo account
- Generates `eas.json` configuration file
- Sets up project for building development builds

### Steps After Answering "Y":

1. **EAS Project Created** ✅
   - Project will be linked to your Expo account
   - Configuration file `eas.json` will be created

2. **Next: Configure Build Profile**
   - EAS will ask about build profiles
   - Choose "development" profile for testing

3. **Build Development Client**:
   ```bash
   eas build --profile development --platform android
   ```

### Complete Setup Process:

```bash
# 1. Answer "Y" to create EAS project
eas build:configure
# → Answer: Y

# 2. Choose build profile (select "development")
# → Select: development

# 3. Build for Android
eas build --profile development --platform android

# 4. Wait for build (10-15 minutes)
# → Download APK when ready

# 5. Install APK on your phone
# → Transfer APK to phone and install

# 6. Run development server
cd mobile-app
expo start --dev-client
```

### What is EAS Build?

**EAS (Expo Application Services) Build**:
- Cloud-based build service
- Creates native Android/iOS apps
- No need for Android Studio or Xcode locally
- Free tier available

### Development Build vs Expo Go:

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| GPS | Limited | ✅ Full Support |
| Native Modules | Limited | ✅ All Supported |
| Custom Code | Limited | ✅ Full Access |
| Setup | Instant | One-time build |
| Offline | No | ✅ Yes |

### After Build Completes:

1. **Download APK** from Expo dashboard
2. **Install on Phone**:
   - Transfer APK to phone
   - Enable "Install from Unknown Sources"
   - Install APK
3. **Start Development Server**:
   ```bash
   cd mobile-app
   expo start --dev-client
   ```
4. **Open App** on phone and scan QR code

### Troubleshooting:

**If build fails**:
- Check `eas.json` configuration
- Verify `app.json` is correct
- Check Expo account has build credits (free tier: 30 builds/month)

**If app doesn't connect**:
- Make sure phone and computer on same Wi-Fi
- Check IP address in `utils/config.js`
- Try tunnel mode: `expo start --dev-client --tunnel`

### Alternative: Quick Test on Web First

While waiting for build, test GPS on web:
```bash
cd mobile-app
npm start
# Press 'w' for web
# Or open test-gps-web.html in browser
```

This verifies GPS code works before mobile testing!

