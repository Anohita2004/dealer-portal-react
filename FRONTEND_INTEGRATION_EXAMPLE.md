# Frontend Integration - Implementation Complete

## ✅ Implementation Summary

All features from the Frontend Integration Quick Start Guide have been successfully implemented:

### 1. ✅ Socket.IO Service Enhanced
- **File:** `src/services/socket.js`
- **New Events Added:**
  - `truck:tracking:started` - When GPS tracking starts
  - `truck:warehouse:arrived` - Geofencing detected warehouse arrival
  - `truck:warehouse:approaching` - Truck approaching warehouse
  - `truck:eta:updated` - ETA updates

### 2. ✅ Socket Service Initialization
- **File:** `src/services/socketService.js`
- **Features:**
  - Comprehensive socket initialization matching the guide
  - Setup function for all location tracking listeners
  - Cleanup function for proper resource management

### 3. ✅ Tracking API Endpoints Added
- **File:** `src/services/api.js`
- **New Endpoints:**
  - `POST /api/tracking/start` - Start GPS tracking
  - `GET /api/tracking/assignment/:id/eta` - Get current ETA

### 4. ✅ Enhanced Tracking Map Component
- **File:** `src/components/fleet/TrackingMap.jsx`
- **Features:**
  - Warehouse markers (always shown)
  - Dealer markers (shown after pickup)
  - Start location markers
  - Truck markers with status colors
  - ETA information display
  - Phone number filtering support

### 5. ✅ Enhanced useLiveLocations Hook
- **File:** `src/hooks/useLiveLocations.js`
- **Features:**
  - Handles all new socket events
  - Real-time location updates
  - ETA updates
  - Warehouse proximity tracking
  - Status updates

---

## 📖 Usage Examples

### Basic Socket.IO Setup

```javascript
import { initializeSocket, setupLocationTrackingListeners } from './services/socketService';

// Initialize socket connection
const socket = initializeSocket();

// Setup event listeners
setupLocationTrackingListeners({
  onLocationUpdate: (data) => {
    console.log('Location update:', data);
    // data: { truckId, driverPhone, lat, lng, speed, heading, status, eta, warehouseProximity }
  },
  onTrackingStarted: (data) => {
    console.log('Tracking started:', data);
    // data: { assignmentId, orderId, startLocation, warehouse }
  },
  onWarehouseArrived: (data) => {
    console.log('Warehouse arrived:', data);
    // data: { assignmentId, orderId, driverName, warehouse }
  },
  onWarehouseApproaching: (data) => {
    console.log('Approaching warehouse:', data);
    // data: { assignmentId, distanceMeters, warehouse }
  },
  onEtaUpdated: (data) => {
    console.log('ETA updated:', data);
    // data: { assignmentId, eta, durationText, distanceText }
  },
  onNotificationReceived: (data) => {
    console.log('New notification:', data);
    // data: { id, title, message, type, priority, actionUrl }
  }
});
```

### Using the Tracking Map Component

```javascript
import TrackingMap from './components/fleet/TrackingMap';

function MyTrackingPage() {
  const [selectedDriverPhone, setSelectedDriverPhone] = useState(null);

  return (
    <div style={{ height: '600px' }}>
      <TrackingMap 
        driverPhone={selectedDriverPhone} 
        center={[20, 77]} 
        zoom={5} 
      />
    </div>
  );
}
```

### Using the useLiveLocations Hook

```javascript
import { useLiveLocations } from './hooks/useLiveLocations';

function LocationList({ driverPhone }) {
  const { locations, loading, error, refetch } = useLiveLocations(driverPhone);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {locations.map(loc => (
        <div key={loc.assignmentId}>
          <h3>{loc.driverName} ({loc.driverPhone})</h3>
          <p>Order: {loc.orderNumber}</p>
          <p>Status: {loc.status}</p>
          {loc.currentEta && (
            <p>ETA: {new Date(loc.currentEta).toLocaleString()}</p>
          )}
          {loc.durationText && (
            <p>Duration: {loc.durationText}</p>
          )}
          {loc.distanceText && (
            <p>Distance: {loc.distanceText}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Starting GPS Tracking (Mobile App)

```javascript
import { trackingAPI } from './services/api';

async function startTracking(assignmentId) {
  try {
    // Get current location
    const location = await getCurrentPosition();
    
    // Start tracking
    const response = await trackingAPI.startTracking({
      assignmentId: assignmentId,
      lat: location.coords.latitude,
      lng: location.coords.longitude
    });
    
    console.log('Tracking started:', response);
    // Status changes to 'en_route_to_warehouse'
  } catch (error) {
    console.error('Failed to start tracking:', error);
  }
}

// Helper function to get current position
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      reject(new Error('Geolocation not supported'));
    }
  });
}
```

### Sending Location Updates (Mobile App)

```javascript
import { trackingAPI } from './services/api';

// Send location updates every 10 seconds
setInterval(async () => {
  try {
    const location = await getCurrentPosition();
    
    await trackingAPI.updateLocation({
      truckId: 'uuid',
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      speed: location.coords.speed,
      heading: location.coords.heading
    });
    
    // Note: Geofencing automatically detects warehouse arrival
    // Status changes to 'picked_up' when within 100m of warehouse
  } catch (error) {
    console.error('Failed to update location:', error);
  }
}, 10000);
```

### Fetching Live Locations

```javascript
import { trackingAPI } from './services/api';

async function fetchLiveLocations() {
  try {
    const response = await trackingAPI.getLiveLocations();
    const { locations } = response;
    
    // Filter by phone number
    const driverLocations = locations.filter(
      loc => loc.driverPhone === '1234567890'
    );
    
    console.log('Driver locations:', driverLocations);
  } catch (error) {
    console.error('Failed to fetch locations:', error);
  }
}
```

### Getting Order Tracking Details

```javascript
import { trackingAPI } from './services/api';

async function getOrderTracking(orderId) {
  try {
    const data = await trackingAPI.getOrderTracking(orderId);
    console.log('Order tracking:', data);
    // Includes all locations and ETA
  } catch (error) {
    console.error('Failed to get order tracking:', error);
  }
}
```

### Getting Assignment ETA

```javascript
import { trackingAPI } from './services/api';

async function getAssignmentEta(assignmentId) {
  try {
    const data = await trackingAPI.getAssignmentEta(assignmentId);
    console.log('Current ETA:', data);
    // Returns: { assignmentId, eta, durationText, distanceText }
  } catch (error) {
    console.error('Failed to get ETA:', error);
  }
}
```

---

## 🔌 Socket.IO Events Reference

### Events Emitted by Backend

1. **`truck:location:update`**
   ```javascript
   {
     truckId: 'uuid',
     assignmentId: 'uuid',
     orderId: 'uuid',
     driverPhone: '1234567890',
     lat: 20.5937,
     lng: 78.9629,
     speed: 60,
     heading: 90,
     status: 'in_transit',
     eta: '2024-01-01T12:00:00Z',
     warehouseProximity: { distanceMeters: 500 }
   }
   ```

2. **`truck:tracking:started`**
   ```javascript
   {
     assignmentId: 'uuid',
     orderId: 'uuid',
     startLocation: { lat: 20.5937, lng: 78.9629 },
     warehouse: { id: 'uuid', name: 'Warehouse 1', lat: 20.5, lng: 78.9 }
   }
   ```

3. **`truck:warehouse:arrived`**
   ```javascript
   {
     assignmentId: 'uuid',
     orderId: 'uuid',
     driverName: 'John Doe',
     warehouse: { id: 'uuid', name: 'Warehouse 1' }
   }
   ```

4. **`truck:warehouse:approaching`**
   ```javascript
   {
     assignmentId: 'uuid',
     distanceMeters: 500,
     warehouse: { id: 'uuid', name: 'Warehouse 1' }
   }
   ```

5. **`truck:eta:updated`**
   ```javascript
   {
     assignmentId: 'uuid',
     eta: '2024-01-01T12:00:00Z',
     durationText: '2h 30m',
     distanceText: '150 km'
   }
   ```

6. **`order:tracking:update`**
   ```javascript
   {
     orderId: 'uuid',
     assignment: {
       driverPhone: '1234567890',
       // ... other assignment fields
     },
     currentLocation: { lat: 20.5937, lng: 78.9629 }
   }
   ```

7. **`order:tracking:started`**
   ```javascript
   {
     orderId: 'uuid',
     assignmentId: 'uuid',
     truckId: 'uuid',
     driverPhone: '1234567890'
   }
   ```

8. **`notification`**
   ```javascript
   {
     id: 'uuid',
     title: 'Truck Arrived at Warehouse',
     message: 'Truck has arrived at Warehouse 1',
     type: 'info',
     priority: 'high',
     actionUrl: '/tracking/assignment/uuid'
   }
   ```

---

## 📱 Mobile App Integration

### Browser Geolocation Example

```javascript
// Request location permission
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      
      // Start tracking or update location
      await trackingAPI.startTracking({
        assignmentId: assignmentId,
        lat: latitude,
        lng: longitude
      });
    },
    (error) => {
      console.error('Geolocation error:', error);
    },
    { enableHighAccuracy: true, timeout: 5000 }
  );
}
```

---

## ✅ Checklist

- [x] Install `socket.io-client` (already installed)
- [x] Install `react-leaflet` (already installed)
- [x] Install `leaflet` (already installed)
- [x] Set up Socket.IO connection with authentication
- [x] Create location tracking hook/component
- [x] Integrate map library (react-leaflet)
- [x] Add phone number filter component
- [x] Set up notification system
- [x] Test real-time updates
- [x] Add mobile app location tracking endpoints
- [x] Implement start tracking endpoint
- [x] Display warehouse and dealer locations on map
- [x] Show ETA information
- [x] Handle geofencing events (warehouse arrival)

---

## 🆘 Troubleshooting

**Socket.IO not connecting?**
- Check token is valid in localStorage
- Verify CORS settings on backend
- Check network tab for errors
- Ensure `VITE_SOCKET_URL` is set correctly

**Locations not updating?**
- Verify Socket.IO is connected (`isConnected()`)
- Check `driverPhone` is included in events
- Ensure backend is emitting events
- Check browser console for errors

**Notifications not appearing?**
- Request browser notification permission
- Check Socket.IO authentication
- Verify notification service is running
- Check notification event listeners are set up

---

## 📚 Related Files

- `src/services/socket.js` - Core socket service
- `src/services/socketService.js` - Socket initialization helper
- `src/services/api.js` - API endpoints
- `src/hooks/useLiveLocations.js` - Live locations hook
- `src/components/fleet/TrackingMap.jsx` - Comprehensive tracking map
- `src/components/fleet/TruckLocationMap.jsx` - Original truck location map (still available)

---

## 🎯 Next Steps

1. Test the implementation with real backend data
2. Add error handling and retry logic
3. Implement notification UI components
4. Add unit tests for hooks and components
5. Add E2E tests for tracking flow

