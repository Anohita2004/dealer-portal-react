# Driver Location Tracking - Testing Guide

This guide provides step-by-step instructions for testing the driver location tracking and notifications system.

## 🧪 Testing Checklist

### 1. Socket.IO Connection ✅

**Test Steps:**
1. Open browser DevTools (F12) → Console tab
2. Navigate to `/fleet/tracking-dashboard`
3. Look for console messages:
   - `✅ Socket.IO connected: [socket-id]`
   - `✅ Socket authenticated: [data]`

**Expected Result:**
- Socket connects successfully
- Authentication message appears
- No connection errors

**Troubleshooting:**
- If connection fails, check:
  - Backend Socket.IO server is running
  - CORS settings allow frontend origin
  - Token is valid in localStorage
  - Network tab shows WebSocket connection

---

### 2. Live Locations Load ✅

**Test Steps:**
1. Navigate to `/fleet/tracking-dashboard`
2. Wait for initial load (should see loading spinner)
3. Check browser Network tab for API call to `/api/tracking/live`

**Expected Result:**
- Map loads with truck markers (if any active trucks)
- Sidebar shows list of active trucks
- No error messages

**Test Data:**
- Ensure at least one assignment exists with status `picked_up` or `in_transit`
- Assignment should have `truckId` and `driverPhone`

**Troubleshooting:**
- If no trucks appear:
  - Check backend has active assignments
  - Verify assignments have truck locations
  - Check browser console for API errors

---

### 3. Real-time Updates ✅

**Test Steps:**
1. Open dashboard in browser
2. Use mobile app to send location update (or simulate via API)
3. Watch map for marker movement

**Expected Result:**
- Truck marker moves on map
- Last update time changes in popup
- Sidebar updates with new location info

**Simulate Location Update:**
```bash
# Using curl (replace with actual values)
curl -X POST http://localhost:3000/api/tracking/location \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "truckId": 1,
    "lat": 19.0760,
    "lng": 72.8777,
    "speed": 45,
    "heading": 90,
    "timestamp": "2024-01-01T12:00:00Z"
  }'
```

**Expected Socket Event:**
- Backend should emit `truck:location:update` event
- Frontend should receive and update map

---

### 4. Phone Number Filtering ✅

**Test Steps:**
1. Navigate to dashboard
2. Enter a driver phone number in the filter field
3. Click "Filter" button
4. Verify map shows only trucks for that driver

**Expected Result:**
- Map filters to show only selected driver's trucks
- Sidebar shows filtered count
- Filter status message appears: "Showing locations for: [phone]"

**Test Cases:**
- Filter by valid phone number → Should show matching trucks
- Filter by non-existent phone → Should show empty map
- Clear filter → Should show all trucks again

**Troubleshooting:**
- If filter doesn't work:
  - Check phone number format matches backend
  - Verify `driverPhone` field exists in location data
  - Check browser console for errors

---

### 5. Map Bounds Adjustment ✅

**Test Steps:**
1. Load dashboard with multiple trucks
2. Observe map automatically fits all trucks
3. Filter by phone number
4. Verify map adjusts to filtered trucks

**Expected Result:**
- Map automatically zooms to show all visible trucks
- Bounds update when filter changes
- Smooth transition (no jarring jumps)

**Test Cases:**
- Single truck → Map centers on truck
- Multiple trucks → Map fits all in view
- No trucks → Map shows default center (India)

---

### 6. Route Lines Display ✅

**Test Steps:**
1. Ensure assignment has warehouse location
2. Ensure truck has current location
3. Verify blue dashed line appears on map

**Expected Result:**
- Blue dashed line connects warehouse to truck
- Line updates as truck moves
- Line disappears if truck/warehouse location missing

**Requirements:**
- Assignment must have `warehouse.lat` and `warehouse.lng`
- Truck must have `truck.lat` and `truck.lng`

---

### 7. Notification Bell ✅

**Test Steps:**
1. Navigate to dashboard
2. Verify notification bell icon appears in header
3. Click bell to open notification dropdown
4. Verify notifications load

**Expected Result:**
- Bell icon visible in top-right
- Badge shows unread count (if any)
- Dropdown shows recent notifications
- Clicking notification navigates to relevant page

**Test Notifications:**
- Mark pickup/delivery in mobile app
- Verify admin receives notification
- Check notification appears in bell dropdown

---

### 8. Protected Route ✅

**Test Steps:**
1. Log in as authorized role (super_admin, regional_admin, etc.)
2. Navigate to `/fleet/tracking-dashboard`
3. Verify page loads successfully
4. Log out and try accessing route
5. Verify redirect to login

**Authorized Roles:**
- `super_admin`
- `regional_admin`
- `regional_manager`
- `area_manager`
- `territory_manager`
- `dealer_admin`

**Expected Result:**
- Authorized users can access dashboard
- Unauthorized users redirected to login
- No 403 errors for authorized users

---

## 🔄 Mobile App Integration Testing

### Test Mobile Location Updates

**Prerequisites:**
- Mobile app installed and configured
- Driver logged in
- Assignment exists with `truckId` and `assignmentId`

**Test Steps:**

1. **Start Assignment:**
   - Open mobile app
   - Navigate to assignment screen
   - Verify assignment details load

2. **Mark Pickup:**
   - Click "Mark Pickup" button
   - Verify GPS tracking starts
   - Check console logs for location updates

3. **Verify Location Updates:**
   - Watch mobile app console for: `Location sent successfully`
   - Check backend receives POST to `/api/tracking/location`
   - Verify frontend dashboard updates in real-time

4. **Mark Delivery:**
   - Click "Mark Delivered" button
   - Verify tracking stops
   - Check notification sent to admin

**Expected Flow:**
```
Mobile App → Mark Pickup → GPS Starts → Location Updates → Backend → Socket.IO → Frontend Dashboard
```

**Checkpoints:**
- ✅ Mobile app requests location permissions
- ✅ Location updates sent every 10 seconds
- ✅ Backend API receives updates
- ✅ Socket.IO emits `truck:location:update`
- ✅ Frontend dashboard receives and displays updates

---

## 🐛 Common Issues & Solutions

### Issue: Socket.IO Not Connecting

**Symptoms:**
- Console shows connection errors
- No real-time updates

**Solutions:**
1. Check backend Socket.IO server is running
2. Verify `VITE_SOCKET_URL` in `.env` matches backend
3. Check CORS settings on backend
4. Verify token is valid in localStorage
5. Check browser console for specific error messages

---

### Issue: No Trucks Appearing on Map

**Symptoms:**
- Map loads but no markers
- Sidebar shows "No active trucks"

**Solutions:**
1. Verify assignments exist with status `picked_up` or `in_transit`
2. Check assignments have `truckId` set
3. Verify trucks have location data (`lat`, `lng`)
4. Check API response in Network tab
5. Verify `driverPhone` field exists in response

---

### Issue: Filter Not Working

**Symptoms:**
- Filter applied but all trucks still show
- Filter shows no trucks when should show some

**Solutions:**
1. Check phone number format matches backend
2. Verify `driverPhone` field in API response
3. Check browser console for filter logic errors
4. Verify phone numbers match exactly (including country code)

---

### Issue: Map Not Updating in Real-time

**Symptoms:**
- Initial load works
- Updates don't appear automatically

**Solutions:**
1. Verify Socket.IO connection is active
2. Check backend emits `truck:location:update` event
3. Verify event includes `assignmentId` or `truckId`
4. Check browser console for Socket.IO errors
5. Verify `useLiveLocations` hook is listening to events

---

## 📊 Performance Testing

### Load Test

**Test Steps:**
1. Create 50+ active assignments
2. Load dashboard
3. Measure load time

**Expected:**
- Dashboard loads in < 3 seconds
- Map renders smoothly
- No memory leaks

### Real-time Update Test

**Test Steps:**
1. Load dashboard with 10+ trucks
2. Send rapid location updates (1 per second)
3. Monitor performance

**Expected:**
- Updates appear smoothly
- No UI freezing
- Map markers update correctly

---

## ✅ Success Criteria

All tests pass when:
- ✅ Socket.IO connects successfully
- ✅ Live locations load on page mount
- ✅ Real-time updates appear within 2 seconds
- ✅ Phone filtering works correctly
- ✅ Map bounds adjust automatically
- ✅ Route lines display correctly
- ✅ Notification bell functions properly
- ✅ Protected route works for authorized roles
- ✅ Mobile app sends location updates successfully
- ✅ Frontend receives and displays mobile updates

---

## 📝 Test Report Template

```markdown
## Test Report - [Date]

### Environment
- Frontend URL: http://localhost:5173
- Backend URL: http://localhost:3000
- Socket.IO URL: ws://localhost:3000
- Browser: Chrome/Firefox/Safari
- Mobile App: iOS/Android

### Test Results
- [ ] Socket.IO Connection: ✅/❌
- [ ] Live Locations Load: ✅/❌
- [ ] Real-time Updates: ✅/❌
- [ ] Phone Filtering: ✅/❌
- [ ] Map Bounds: ✅/❌
- [ ] Route Lines: ✅/❌
- [ ] Notifications: ✅/❌
- [ ] Protected Route: ✅/❌
- [ ] Mobile Integration: ✅/❌

### Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Status: Open/Fixed

### Notes
[Additional observations]
```

---

## 🚀 Next Steps After Testing

1. **Fix any issues** found during testing
2. **Performance optimization** if needed
3. **User acceptance testing** with actual drivers
4. **Production deployment** after all tests pass
5. **Monitor** real-world usage and performance

