# API Configuration Guide

## Setting Up API URL for Mobile App

### Problem
The mobile app cannot connect to `localhost` because:
- Mobile devices don't recognize `localhost` as your computer
- You need to use your computer's actual IP address

### Solution

#### Step 1: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually Wi-Fi or Ethernet)

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```
or
```bash
ip addr show | grep "inet "
```

You'll see something like: `192.168.1.100` or `192.168.29.61`

#### Step 2: Update API URL

**Option A: Environment Variable (Recommended)**

Create a `.env` file in `mobile-app/` directory:
```
EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:3000/api
EXPO_PUBLIC_SOCKET_URL=http://YOUR_IP_ADDRESS:3000
```

Example:
```
EXPO_PUBLIC_API_URL=http://192.168.29.61:3000/api
EXPO_PUBLIC_SOCKET_URL=http://192.168.29.61:3000
```

**Option B: Direct Edit**

Edit `mobile-app/services/api.js`:
```javascript
const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3000/api';
```

Edit `mobile-app/services/socket.js`:
```javascript
const SOCKET_URL = 'http://YOUR_IP_ADDRESS:3000';
```

#### Step 3: Restart Expo

After changing the API URL:
1. Stop Expo server (Ctrl+C)
2. Restart: `npm start`
3. Reload app in Expo Go

### Troubleshooting

#### "Cannot connect to server"
- ✅ Check backend is running: `http://YOUR_IP:3000/health`
- ✅ Check firewall allows port 3000
- ✅ Verify phone and computer are on same Wi-Fi network
- ✅ Try accessing API URL in phone's browser: `http://YOUR_IP:3000/api/auth/login`

#### "Network Error"
- Check if backend CORS allows your phone's origin
- Verify backend is listening on `0.0.0.0` not just `localhost`

#### Testing Connection

Test in phone's browser:
```
http://YOUR_IP:3000/health
```

Should return: `{"status":"ok"}`

### Production Setup

For production, use your actual backend URL:
```
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
EXPO_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

