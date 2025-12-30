# Dealer Portal Mobile App

React Native mobile application for fleet management and GPS tracking.

## Features

- Driver login and authentication
- View assigned orders
- Mark pickup at warehouse
- Automatic GPS tracking when pickup is confirmed
- Real-time location updates
- Mark delivery
- View assignment details

## Prerequisites

- Node.js 16+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)
- Or Android Studio / Xcode for emulator testing

## Installation

1. Install dependencies:
```bash
cd mobile-app
npm install
```

2. Configure API endpoints:
   - Edit `services/api.js` and update `API_BASE_URL`
   - Edit `services/socket.js` and update `SOCKET_URL`

3. Start the development server:
```bash
npm start
```

4. Run on device/emulator:
```bash
# For iOS
npm run ios

# For Android
npm run android
```

## Project Structure

```
mobile-app/
├── App.js                 # Main app entry point
├── screens/
│   ├── LoginScreen.js     # Driver login
│   ├── DashboardScreen.js # Assignment list
│   └── AssignmentScreen.js # Assignment details
├── services/
│   ├── api.js            # API client
│   ├── socket.js         # Socket.IO client
│   └── locationTracker.js # GPS tracking service
├── package.json
└── app.json              # Expo configuration
```

## Key Components

### LocationTracker

Automatically handles GPS tracking:
- Starts tracking when pickup is confirmed
- Sends location updates every 10 seconds
- Stops tracking when delivery is marked
- Listens for Socket.IO events to start/stop tracking

### API Service

Handles all backend API calls:
- Authentication
- Fleet assignments
- Location updates
- Status updates

### Socket.IO Service

Manages real-time communication:
- Connection management
- Event listeners for status changes
- Tracking room management

## GPS Tracking Flow

1. Driver logs in and sees assignments
2. Driver selects an assignment
3. Driver arrives at warehouse and marks pickup
4. Backend updates status to "picked_up"
5. Mobile app automatically starts GPS tracking
6. Location updates sent every 10 seconds
7. Driver marks delivery
8. GPS tracking stops automatically

## Permissions

The app requires:
- Location permissions (foreground and background)
- Network access
- Storage (for token caching)

## Configuration

Update these URLs in the service files:

- `services/api.js`: Set `API_BASE_URL`
- `services/socket.js`: Set `SOCKET_URL`

## Building for Production

```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios
```

## Troubleshooting

### Location not updating
- Check location permissions are granted
- Verify backend API is accessible
- Check rate limiting (10 seconds between updates)

### Socket.IO not connecting
- Verify backend URL is correct
- Check authentication token is valid
- Ensure backend CORS allows mobile app origin

### Build errors
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Support

For issues or questions, refer to the main project documentation.

