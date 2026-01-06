# Live Truck Tracking - Testing Guide

## Quick Test (Easiest Method)

### Option 1: Browser Console Test (No setup required!)

1. **Login to the web app**
   - Open http://localhost:5173
   - Login with your driver credentials

2. **Open Browser DevTools**
   - Press `F12` or right-click → Inspect
   - Go to the **Console** tab

3. **Run this code** (paste and press Enter):

```javascript
// Simulate moving truck
let lat = 22.540638;
let lng = 88.353808;
const truckId = '8cf20524-e0be-4589-9572-a9efc37b0bf4';
const token = localStorage.getItem('token');

async function sendLocation() {
  lat += 0.0001;  // Move north
  lng += 0.0001;  // Move east
  
  const response = await fetch('http://localhost:3000/api/tracking/location', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      truckId: truckId,
      lat: lat,
      lng: lng,
      speed: 35,
      heading: 45,
      timestamp: new Date().toISOString()
    })
  });
  
  const data = await response.json();
  console.log(`✅ Location sent: (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
}

// Send location every 3 seconds
console.log('🚚 Starting simulation...');
console.log('📍 Open Live Tracking page to see movement!');
const interval = setInterval(sendLocation, 3000);

// To stop: clearInterval(interval)
```

4. **Open Live Tracking page**
   - Navigate to Fleet → Live Tracking
   - Watch the truck marker move on the map!

5. **To stop the simulation**:
   ```javascript
   clearInterval(interval);
   ```

---

## Option 2: PowerShell Script (Windows)

1. **Get your auth token**:
   - Login to http://localhost:5173
   - Open DevTools (F12) → Console
   - Run: `localStorage.getItem('token')`
   - Copy the token

2. **Run the test script**:
   ```powershell
   .\test-tracking.ps1
   ```

3. **Paste your token** when prompted

4. **Watch the map** at http://localhost:5173 → Fleet → Live Tracking

---

## Option 3: Node.js Script

1. **Update token in script**:
   ```bash
   notepad test-tracking-simple.js
   # Replace YOUR_TOKEN_HERE with your actual token
   ```

2. **Run the script**:
   ```bash
   node test-tracking-simple.js
   ```

---

## Expected Behavior

✅ **Console Output** (Browser DevTools):
```
Joining truck tracking room: 8cf20524-e0be-4589-9572-a9efc37b0bf4
Socket.IO location update received: { truckId: "8cf20524...", lat: 22.540738, lng: 88.353908 }
Updated truck position: { oldLat: 22.540638, newLat: 22.540738, ... }
```

✅ **Map Behavior**:
- Map stays static (doesn't refresh)
- Truck marker (🚚) moves smoothly to new position
- Updates every 3 seconds
- Marker position changes without page reload

❌ **If not working**, check:
1. Backend server running on port 3000
2. Socket.IO connection established (check console)
3. Auth token is valid (not expired)
4. TruckId matches the assignment

---

## Troubleshooting

### "401 Unauthorized"
- Token expired → Login again and get new token

### "400 Bad Request"
- Check if truckId is correct
- Ensure lat/lng are valid numbers

### "Truck not found in locations list"
- Make sure the truck has an active assignment
- Check if truckId matches the one in the assignment

### "Map not updating"
- Check browser console for Socket.IO errors
- Verify Socket.IO connection: `socket?.connected` should be `true`
- Check if you joined the tracking room: Look for "Joining truck tracking room" log

---

## Mobile App Testing

If you want to test with the actual mobile app:

1. **Rebuild the mobile app** with latest changes
2. **Login as driver** on the phone
3. **Enable GPS** and allow location permissions
4. **Move around** (walk/drive)
5. **Watch the web map** - truck should update every 10 seconds

---

## Tips

- Use browser console method for quickest testing
- Adjust update interval (3000ms) to test faster/slower
- Check Network tab in DevTools to see API requests
- Check Console for Socket.IO events
- Open Live Tracking page BEFORE starting simulation for best results
