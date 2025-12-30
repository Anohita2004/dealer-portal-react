# Quick Start - Driver Location Tracking

## 🚀 Getting Started

### 1. Access the Dashboard

Navigate to: **`/fleet/tracking-dashboard`**

**Required Roles:**
- Super Admin
- Regional Admin
- Regional Manager
- Area Manager
- Territory Manager
- Dealer Admin

### 2. View Live Locations

- Map automatically loads all active truck locations
- Trucks with status `picked_up` or `in_transit` are shown
- Each truck marker is color-coded by status

### 3. Filter by Driver Phone

- Enter driver phone number in the filter field
- Click "Filter" to show only that driver's trucks
- Click "Clear" to show all trucks again

### 4. Real-time Updates

- Location updates appear automatically via Socket.IO
- Updates occur every 10 seconds from mobile app
- Map markers move in real-time as trucks move

---

## 📱 Mobile App Flow

### For Drivers:

1. **Open Assignment**
   - Navigate to assignment screen
   - View assignment details

2. **Mark Pickup**
   - Click "Mark Pickup" button
   - GPS tracking starts automatically
   - Location updates sent every 10 seconds

3. **In Transit**
   - Location continues updating automatically
   - Admin can see truck movement on dashboard

4. **Mark Delivery**
   - Click "Mark Delivered" button
   - GPS tracking stops
   - Admin receives notification

---

## 🔧 Technical Details

### API Endpoints

- `GET /api/tracking/live` - Get all live truck locations
- `POST /api/tracking/location` - Update truck location (mobile app)
- `GET /api/tracking/order/:orderId` - Get order tracking data

### Socket.IO Events

- `truck:location:update` - Real-time location updates
- `order:tracking:update` - Order tracking updates
- `order:tracking:started` - Tracking started event
- `notification` - Real-time notifications

### Components

- `TruckLocationMap` - Main map component
- `DriverFilter` - Phone number filter
- `useLiveLocations` - Hook for live locations
- `useOrderTracking` - Hook for order tracking

---

## 🐛 Troubleshooting

### No trucks showing?

1. Check assignments exist with status `picked_up` or `in_transit`
2. Verify assignments have `truckId` set
3. Check trucks have location data (`lat`, `lng`)

### Real-time updates not working?

1. Check Socket.IO connection in browser console
2. Verify backend emits `truck:location:update` events
3. Check mobile app is sending location updates

### Filter not working?

1. Verify phone number format matches backend
2. Check `driverPhone` field exists in location data
3. Ensure exact phone number match (including country code)

---

## 📚 Documentation

- **Full Implementation Guide**: `DRIVER_LOCATION_TRACKING_IMPLEMENTATION.md`
- **Testing Guide**: `TESTING_GUIDE_LOCATION_TRACKING.md`
- **Backend API**: `DRIVER_MANAGEMENT_BACKEND_API.md`

---

## ✅ Checklist

Before going live:

- [ ] Socket.IO server running
- [ ] Environment variables configured
- [ ] Mobile app configured with correct API URL
- [ ] Test with at least one assignment
- [ ] Verify real-time updates work
- [ ] Test phone number filtering
- [ ] Check notifications work
- [ ] Verify protected routes

---

## 🎯 Key Features

✅ Real-time location tracking  
✅ Phone number filtering  
✅ Interactive map with custom icons  
✅ Route visualization  
✅ Automatic map bounds adjustment  
✅ Real-time Socket.IO updates  
✅ Mobile app integration  
✅ Notification system  

---

**Ready to track! 🚛📍**

