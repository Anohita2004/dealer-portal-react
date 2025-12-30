# Mobile App Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd mobile-app
   npm install
   ```

2. **Configure Backend URLs**
   
   Edit `services/api.js`:
   ```javascript
   const API_BASE_URL = 'https://your-backend-api.com/api';
   ```
   
   Edit `services/socket.js`:
   ```javascript
   const SOCKET_URL = 'https://your-backend-api.com';
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Run on Device/Emulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## Configuration

### API Endpoints

Update these files with your backend URLs:

- `services/api.js` - Line 5: `API_BASE_URL`
- `services/socket.js` - Line 5: `SOCKET_URL`

### Environment Variables (Optional)

Create `.env` file:
```
API_BASE_URL=https://your-api.com/api
SOCKET_URL=https://your-api.com
```

Then update `services/api.js`:
```javascript
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
```

## Features

### ✅ Implemented

- Driver login and authentication
- View assigned orders
- Assignment details screen
- Mark pickup at warehouse
- Automatic GPS tracking when pickup confirmed
- Real-time location updates via Socket.IO
- Mark delivery
- Profile screen with logout

### 🔄 GPS Tracking Flow

1. Driver logs in → Sees assignments
2. Driver selects assignment → Views details
3. Driver arrives at warehouse → Marks pickup
4. **GPS tracking starts automatically**
5. Location updates sent every 10 seconds
6. Driver arrives at destination → Marks delivery
7. **GPS tracking stops automatically**

## Testing

### Test on Physical Device

1. Install Expo Go app on your phone
2. Run `npm start`
3. Scan QR code with Expo Go

### Test on Emulator

**Android:**
```bash
# Start Android emulator first
npm run android
```

**iOS (Mac only):**
```bash
# Start iOS simulator
npm run ios
```

## Troubleshooting

### Location Permissions Not Working

- Check `app.json` has location permissions configured
- On Android: Check app settings → Permissions → Location
- On iOS: Check Settings → Privacy → Location Services

### Socket.IO Not Connecting

- Verify backend URL is correct
- Check backend CORS settings allow mobile app origin
- Verify authentication token is valid
- Check network connectivity

### GPS Not Updating

- Verify location permissions granted
- Check backend API is accessible
- Verify assignment status is "picked_up" or "in_transit"
- Check rate limiting (10 seconds between updates)

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
expo start -c
```

## Production Build

### Android APK

```bash
expo build:android
```

### iOS IPA

```bash
expo build:ios
```

## Architecture

### Services

- **api.js**: HTTP API client with authentication
- **socket.js**: Socket.IO client for real-time updates
- **locationTracker.js**: GPS tracking service

### Screens

- **LoginScreen**: Driver authentication
- **DashboardScreen**: List of assignments
- **AssignmentScreen**: Assignment details and actions
- **ProfileScreen**: User profile and logout

### Navigation

- Stack Navigator: Login → Main → Assignment
- Tab Navigator: Dashboard ↔ Profile

## API Integration

The mobile app integrates with these backend endpoints:

- `POST /api/auth/login` - Driver login
- `GET /api/fleet/assignments` - Get driver assignments
- `GET /api/fleet/assignments/:id` - Get assignment details
- `POST /api/fleet/assignments/:id/pickup` - Mark pickup
- `POST /api/fleet/assignments/:id/deliver` - Mark delivery
- `POST /api/tracking/location` - Send GPS location

## Socket.IO Events

The app listens for:

- `truck:status:change` - Assignment status changed
- `order:tracking:started` - Tracking started
- `truck:location:update` - Truck location updated

## Security Notes

- Tokens stored securely in AsyncStorage
- API calls include authentication headers
- Socket.IO authenticated with JWT token
- Location data sent only when tracking active

