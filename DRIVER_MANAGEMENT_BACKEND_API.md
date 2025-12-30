# Driver Management - Backend API Documentation

This document provides the complete backend API endpoints needed for driver management functionality.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints (except `/api/auth/*`) require JWT token in header:
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### POST `/api/auth/login`
**Description:** Driver login with username and password (returns OTP requirement)

**Request:**
```json
{
  "username": "driver001",
  "password": "driver123"
}
```

**Response (OTP Required):**
```json
{
  "otpSent": true,
  "userId": "uuid-here",
  "message": "OTP sent to email"
}
```

**Response (Direct Login - if OTP disabled):**
```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "username": "driver001",
    "email": "driver@example.com",
    "role": "driver",
    "roleId": 10,
    "isActive": true
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Invalid credentials
- `400` - Validation error

---

### POST `/api/auth/verify-otp`
**Description:** Verify OTP and get JWT token

**Request:**
```json
{
  "userId": "uuid",
  "otp": "123456"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "username": "driver001",
    "email": "driver@example.com",
    "role": "driver",
    "roleId": 10,
    "phoneNumber": "+91 9876543210",
    "regionId": "uuid",
    "isActive": true
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Invalid OTP
- `400` - Validation error

---

## 👥 User/Driver Management Endpoints

### GET `/api/admin/users`
**Description:** Get list of users (filtered by role for drivers)

**Query Parameters:**
- `role` (string, optional): Filter by role (e.g., "driver", "fleet_driver")
- `isActive` (boolean, optional): Filter by active status
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `search` (string, optional): Search by username/email

**Example:**
```
GET /api/admin/users?role=driver&isActive=true&page=1&limit=10
```

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "driver001",
      "email": "driver@example.com",
      "phoneNumber": "+91 9876543210",
      "role": "driver",
      "roleId": 10,
      "roleDetails": {
        "id": 10,
        "name": "driver"
      },
      "regionId": "uuid",
      "region": {
        "id": "uuid",
        "name": "North Region"
      },
      "isActive": true,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "totalPages": 3
}
```

**Permissions:** `super_admin`, `regional_admin`, `regional_manager`

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden

---

### GET `/api/admin/users/:id`
**Description:** Get user/driver by ID

**Response:**
```json
{
  "id": "uuid",
  "username": "driver001",
  "email": "driver@example.com",
  "phoneNumber": "+91 9876543210",
  "role": "driver",
  "roleId": 10,
  "regionId": "uuid",
  "areaId": "uuid",
  "territoryId": "uuid",
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00Z"
}
```

**Permissions:** `super_admin`, `regional_admin`, `regional_manager`

---

### POST `/api/admin/users`
**Description:** Create a new driver/user

**Request Body:**
```json
{
  "username": "driver001",
  "email": "driver@example.com",
  "password": "driver123",
  "phoneNumber": "+91 9876543210",
  "roleId": 10,
  "regionId": "uuid",
  "areaId": "uuid",
  "territoryId": "uuid",
  "isActive": true
}
```

**Required Fields:**
- `username` (string): Unique username
- `email` (string): Valid email address (required for OTP)
- `password` (string): Minimum 6 characters
- `roleId` (number): Role ID (driver role)

**Optional Fields:**
- `phoneNumber` (string): Driver's phone number
- `regionId` (uuid): Assign to region
- `areaId` (uuid): Assign to area
- `territoryId` (uuid): Assign to territory
- `isActive` (boolean): Active status (default: true)

**Response:**
```json
{
  "id": "uuid",
  "username": "driver001",
  "email": "driver@example.com",
  "phoneNumber": "+91 9876543210",
  "role": "driver",
  "roleId": 10,
  "regionId": "uuid",
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00Z"
}
```

**Permissions:** `super_admin`, `regional_admin`

**Status Codes:**
- `201` - Created successfully
- `400` - Validation error (duplicate username/email, invalid role, etc.)
- `401` - Unauthorized
- `403` - Forbidden

**Validation Rules:**
- Username must be unique
- Email must be unique and valid format
- Password must be at least 6 characters
- Role must exist in database
- Region/Area/Territory must exist if provided
- Admin can only create drivers in their scope (regional_admin can only create in their region)

---

### PUT `/api/admin/users/:id`
**Description:** Update driver/user information

**Request Body:**
```json
{
  "username": "driver001",
  "email": "driver@example.com",
  "phoneNumber": "+91 9876543210",
  "roleId": 10,
  "regionId": "uuid",
  "isActive": true
}
```

**Note:** Password update should be separate endpoint (see below)

**Response:**
```json
{
  "id": "uuid",
  "username": "driver001",
  "email": "driver@example.com",
  "phoneNumber": "+91 9876543210",
  "role": "driver",
  "roleId": 10,
  "regionId": "uuid",
  "isActive": true,
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

**Permissions:** `super_admin`, `regional_admin`

**Status Codes:**
- `200` - Updated successfully
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - User not found

---

### PATCH `/api/admin/users/:id/password`
**Description:** Update driver password (separate endpoint for security)

**Request Body:**
```json
{
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

**Permissions:** `super_admin`, `regional_admin`

**Status Codes:**
- `200` - Password updated
- `400` - Validation error (password too short)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - User not found

---

### DELETE `/api/admin/users/:id`
**Description:** Delete driver/user (soft delete recommended)

**Response:**
```json
{
  "message": "Driver deleted successfully"
}
```

**Permissions:** `super_admin`, `regional_admin`

**Status Codes:**
- `200` - Deleted successfully
- `401` - Unauthorized
- `403` - Forbidden
- `404` - User not found

**Note:** Consider soft delete (set `isActive: false`) instead of hard delete to preserve data integrity.

---

### PATCH `/api/admin/users/:id/activate`
**Description:** Activate driver account

**Response:**
```json
{
  "message": "Driver activated successfully",
  "user": {
    "id": "uuid",
    "isActive": true
  }
}
```

**Permissions:** `super_admin`, `regional_admin`

---

### PATCH `/api/admin/users/:id/deactivate`
**Description:** Deactivate driver account

**Response:**
```json
{
  "message": "Driver deactivated successfully",
  "user": {
    "id": "uuid",
    "isActive": false
  }
}
```

**Permissions:** `super_admin`, `regional_admin`

---

## 📋 Supporting Endpoints

### GET `/api/roles`
**Description:** Get all available roles (to find driver role ID)

**Response:**
```json
[
  {
    "id": 1,
    "name": "super_admin",
    "displayName": "Super Admin"
  },
  {
    "id": 10,
    "name": "driver",
    "displayName": "Driver"
  },
  {
    "id": 11,
    "name": "fleet_driver",
    "displayName": "Fleet Driver"
  }
]
```

**Permissions:** Authenticated users

---

### GET `/api/regions`
**Description:** Get all regions (for driver assignment)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "North Region",
    "code": "NR"
  }
]
```

**Permissions:** Authenticated users

---

### GET `/api/areas`
**Description:** Get areas (filtered by region if provided)

**Query Parameters:**
- `regionId` (uuid, optional): Filter by region

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Mumbai Area",
    "code": "MA",
    "regionId": "uuid"
  }
]
```

**Permissions:** Authenticated users

---

### GET `/api/territories`
**Description:** Get territories (filtered by area if provided)

**Query Parameters:**
- `areaId` (uuid, optional): Filter by area

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Mumbai Central",
    "code": "MC",
    "areaId": "uuid"
  }
]
```

**Permissions:** Authenticated users

---

## 🔄 Driver Role Assignment Flow

### Step 1: Create Driver Role (if not exists)
```sql
-- Example SQL to create driver role
INSERT INTO roles (name, display_name, created_at, updated_at)
VALUES ('driver', 'Driver', NOW(), NOW());
```

Or use role creation endpoint:
```
POST /api/roles
{
  "name": "driver",
  "displayName": "Driver"
}
```

### Step 2: Create Driver User
```
POST /api/admin/users
{
  "username": "driver001",
  "email": "driver@example.com",
  "password": "driver123",
  "roleId": 10,
  "regionId": "uuid",
  "isActive": true
}
```

### Step 3: Driver Logs In via Mobile App
```
POST /api/auth/login
{
  "username": "driver001",
  "password": "driver123"
}
```

### Step 4: Driver Receives OTP
- Backend sends OTP to driver's email
- Response: `{ "otpSent": true, "userId": "uuid" }`

### Step 5: Driver Verifies OTP
```
POST /api/auth/verify-otp
{
  "userId": "uuid",
  "otp": "123456"
}
```

### Step 6: Driver Receives Token
- Response includes JWT token
- Driver can now access protected endpoints

---

## 🚛 Fleet Assignment Endpoints (For Drivers)

### GET `/api/fleet/assignments`
**Description:** Get driver's assignments (filtered by driver's truck)

**Query Parameters:**
- `status` (string, optional): Filter by status (assigned, picked_up, in_transit, delivered)
- `truckId` (uuid, optional): Filter by truck ID

**Response:**
```json
{
  "assignments": [
    {
      "id": "uuid",
      "orderId": "uuid",
      "order": {
        "id": "uuid",
        "orderNumber": "ORD-001",
        "dealer": {
          "businessName": "ABC Dealers",
          "address": "123 Street"
        }
      },
      "truckId": "uuid",
      "truck": {
        "id": "uuid",
        "truckName": "Truck-001",
        "licenseNumber": "MH-01-AB-1234"
      },
      "warehouseId": "uuid",
      "warehouse": {
        "id": "uuid",
        "name": "Mumbai Warehouse",
        "address": "456 Warehouse St",
        "lat": 19.0760,
        "lng": 72.8777
      },
      "driverName": "John Driver",
      "driverPhone": "+91 9876543210",
      "status": "assigned",
      "assignedAt": "2025-01-15T10:00:00Z",
      "estimatedDeliveryAt": "2025-01-15T18:00:00Z"
    }
  ],
  "total": 5
}
```

**Permissions:** Driver (sees only their assignments), Fleet managers

---

### GET `/api/fleet/assignments/:id`
**Description:** Get assignment details

**Response:**
```json
{
  "id": "uuid",
  "orderId": "uuid",
  "order": { ... },
  "truck": { ... },
  "warehouse": { ... },
  "status": "assigned",
  "driverName": "John Driver",
  "driverPhone": "+91 9876543210",
  "assignedAt": "2025-01-15T10:00:00Z",
  "pickupAt": null,
  "deliveredAt": null,
  "estimatedDeliveryAt": "2025-01-15T18:00:00Z"
}
```

**Permissions:** Driver (their assignments only), Fleet managers

---

### POST `/api/fleet/assignments/:id/pickup`
**Description:** Driver marks pickup at warehouse (triggers GPS tracking)

**Response:**
```json
{
  "id": "uuid",
  "status": "picked_up",
  "pickupAt": "2025-01-15T12:00:00Z",
  "order": {
    "status": "In Transit"
  },
  "message": "Pickup confirmed. GPS tracking is now active."
}
```

**Permissions:** Driver (their assignments only)

**Status Codes:**
- `200` - Pickup confirmed
- `400` - Invalid status transition
- `401` - Unauthorized
- `403` - Forbidden (not driver's assignment)
- `404` - Assignment not found

**Backend Actions:**
1. Update assignment status to "picked_up"
2. Update order status to "In Transit"
3. Set `pickupAt` timestamp
4. Send notification to superadmin
5. Emit Socket.IO event: `order:tracking:started`

---

### POST `/api/fleet/assignments/:id/deliver`
**Description:** Driver marks delivery complete (stops GPS tracking)

**Response:**
```json
{
  "id": "uuid",
  "status": "delivered",
  "deliveredAt": "2025-01-15T18:00:00Z",
  "order": {
    "status": "Delivered"
  },
  "message": "Delivery confirmed. GPS tracking stopped."
}
```

**Permissions:** Driver (their assignments only)

**Status Codes:**
- `200` - Delivery confirmed
- `400` - Invalid status transition
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Assignment not found

**Backend Actions:**
1. Update assignment status to "delivered"
2. Update order status to "Delivered"
3. Set `deliveredAt` timestamp
4. Stop GPS tracking (mobile app should stop sending location updates)

---

## 📍 Location Tracking Endpoints

### POST `/api/tracking/location`
**Description:** Update truck location (called by mobile app)

**Request Body:**
```json
{
  "truckId": "uuid",
  "lat": 19.0760,
  "lng": 72.8777,
  "speed": 45.5,
  "heading": 90,
  "timestamp": "2025-01-15T12:00:00Z"
}
```

**Required Fields:**
- `truckId` (uuid): Truck ID
- `lat` (number): Latitude (-90 to 90)
- `lng` (number): Longitude (-180 to 180)

**Optional Fields:**
- `speed` (number): Speed in km/h
- `heading` (number): Direction in degrees (0-360)
- `timestamp` (ISO string): Timestamp (defaults to now)

**Response:**
```json
{
  "success": true,
  "truckId": "uuid",
  "lat": 19.0760,
  "lng": 72.8777,
  "timestamp": "2025-01-15T12:00:00Z"
}
```

**Permissions:** Driver (their truck only)

**Rate Limiting:**
- Maximum 1 update per 10 seconds per truck
- Returns `429 Too Many Requests` if exceeded

**Status Codes:**
- `200` - Location updated
- `400` - Invalid coordinates
- `401` - Unauthorized
- `403` - Forbidden (not driver's truck)
- `429` - Rate limit exceeded

**Backend Actions:**
1. Validate coordinates
2. Check rate limit
3. Save to location history
4. Update truck's current location
5. Broadcast via Socket.IO: `truck:location:update`

---

### GET `/api/tracking/live`
**Description:** Get live truck locations (for managers/admins)

**Response:**
```json
{
  "locations": [
    {
      "assignmentId": "uuid",
      "orderId": "uuid",
      "orderNumber": "ORD-001",
      "truck": {
        "id": "uuid",
        "truckName": "Truck-001",
        "licenseNumber": "MH-01-AB-1234",
        "lat": 19.0760,
        "lng": 72.8777,
        "lastUpdate": "2025-01-15T12:00:00Z"
      },
      "warehouse": {
        "id": "uuid",
        "name": "Mumbai Warehouse",
        "lat": 19.0760,
        "lng": 72.8777
      },
      "status": "in_transit",
      "driverName": "John Driver"
    }
  ]
}
```

**Permissions:** `super_admin`, Fleet managers

---

### GET `/api/tracking/order/:orderId`
**Description:** Get order tracking details

**Response:**
```json
{
  "orderId": "uuid",
  "orderNumber": "ORD-001",
  "status": "In Transit",
  "assignment": {
    "id": "uuid",
    "status": "in_transit",
    "driverName": "John Driver",
    "driverPhone": "+91 9876543210",
    "assignedAt": "2025-01-15T10:00:00Z",
    "pickupAt": "2025-01-15T12:00:00Z",
    "estimatedDeliveryAt": "2025-01-15T18:00:00Z",
    "truck": {
      "id": "uuid",
      "truckName": "Truck-001",
      "licenseNumber": "MH-01-AB-1234",
      "currentLat": 19.0760,
      "currentLng": 72.8777,
      "lastLocationUpdate": "2025-01-15T12:05:00Z"
    },
    "warehouse": {
      "id": "uuid",
      "name": "Mumbai Warehouse",
      "lat": 19.0760,
      "lng": 72.8777,
      "address": "456 Warehouse St"
    }
  },
  "currentLocation": {
    "lat": 19.0760,
    "lng": 72.8777,
    "speed": 45.5,
    "heading": 90,
    "lastUpdate": "2025-01-15T12:05:00Z"
  },
  "locationHistory": [
    {
      "lat": 19.0760,
      "lng": 72.8777,
      "speed": 45.5,
      "heading": 90,
      "timestamp": "2025-01-15T12:05:00Z"
    }
  ]
}
```

**Permissions:** Order owner, Fleet managers, Admins

---

## 🔌 Socket.IO Events

### Client → Server Events

#### `authenticate`
**Description:** Authenticate socket connection
```javascript
socket.emit('authenticate', { token: 'jwt-token' });
```

#### `track_truck`
**Description:** Start tracking a specific truck
```javascript
socket.emit('track_truck', { truckId: 'uuid' });
```

#### `track_order`
**Description:** Start tracking a specific order
```javascript
socket.emit('track_order', { orderId: 'uuid' });
```

#### `join_fleet_scope`
**Description:** Join fleet scope room (for managers)
```javascript
socket.emit('join_fleet_scope', {
  regionId: 'uuid',
  areaId: 'uuid'
});
```

#### `untrack_truck`
**Description:** Stop tracking a truck
```javascript
socket.emit('untrack_truck', { truckId: 'uuid' });
```

#### `untrack_order`
**Description:** Stop tracking an order
```javascript
socket.emit('untrack_order', { orderId: 'uuid' });
```

---

### Server → Client Events

#### `truck:location:update`
**Description:** Real-time truck location update
```javascript
socket.on('truck:location:update', (data) => {
  // data: {
  //   truckId: 'uuid',
  //   assignmentId: 'uuid',
  //   orderId: 'uuid',
  //   lat: 19.0760,
  //   lng: 72.8777,
  //   speed: 45.5,
  //   heading: 90,
  //   timestamp: '2025-01-15T12:05:00Z'
  // }
});
```

#### `truck:status:change`
**Description:** Truck assignment status changed
```javascript
socket.on('truck:status:change', (data) => {
  // data: {
  //   truckId: 'uuid',
  //   assignmentId: 'uuid',
  //   orderId: 'uuid',
  //   status: 'picked_up' | 'in_transit' | 'delivered'
  // }
});
```

#### `order:tracking:update`
**Description:** Order tracking update
```javascript
socket.on('order:tracking:update', (data) => {
  // data: {
  //   orderId: 'uuid',
  //   assignment: { id: 'uuid', status: 'in_transit' },
  //   currentLocation: {
  //     lat: 19.0760,
  //     lng: 72.8777,
  //     speed: 45.5,
  //     heading: 90,
  //     timestamp: '2025-01-15T12:05:00Z'
  //   }
  // }
});
```

#### `order:tracking:started`
**Description:** GPS tracking started (sent when pickup is confirmed)
```javascript
socket.on('order:tracking:started', (data) => {
  // data: {
  //   assignmentId: 'uuid',
  //   orderId: 'uuid',
  //   truckId: 'uuid',
  //   message: 'GPS tracking is now active'
  // }
});
```

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  role_id INTEGER REFERENCES roles(id),
  region_id UUID REFERENCES regions(id),
  area_id UUID REFERENCES areas(id),
  territory_id UUID REFERENCES territories(id),
  dealer_id UUID REFERENCES dealers(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_region ON users(region_id);
CREATE INDEX idx_users_active ON users(is_active);
```

### Roles Table
```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert driver role
INSERT INTO roles (name, display_name) VALUES ('driver', 'Driver');
INSERT INTO roles (name, display_name) VALUES ('fleet_driver', 'Fleet Driver');
```

### Fleet Assignments Table
```sql
CREATE TABLE fleet_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  truck_id UUID REFERENCES trucks(id),
  warehouse_id UUID REFERENCES warehouses(id),
  driver_name VARCHAR(255),
  driver_phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'assigned',
  assigned_at TIMESTAMP DEFAULT NOW(),
  pickup_at TIMESTAMP,
  delivered_at TIMESTAMP,
  estimated_delivery_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assignments_order ON fleet_assignments(order_id);
CREATE INDEX idx_assignments_truck ON fleet_assignments(truck_id);
CREATE INDEX idx_assignments_status ON fleet_assignments(status);
```

### Truck Location History Table
```sql
CREATE TABLE truck_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id UUID REFERENCES trucks(id),
  assignment_id UUID REFERENCES fleet_assignments(id),
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2),
  heading DECIMAL(5, 2),
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_location_truck ON truck_location_history(truck_id);
CREATE INDEX idx_location_assignment ON truck_location_history(assignment_id);
CREATE INDEX idx_location_timestamp ON truck_location_history(timestamp);
```

---

## 🔒 Security & Validation

### Password Requirements
- Minimum 6 characters
- Should be hashed using bcrypt (salt rounds: 10)
- Never return password hash in API responses

### Role-Based Access Control
- `super_admin`: Can create/manage all drivers
- `regional_admin`: Can create/manage drivers in their region only
- `regional_manager`: Can view drivers in their region
- Drivers: Can only view/edit their own profile and assignments

### Validation Rules
1. **Username:**
   - Must be unique
   - 3-50 characters
   - Alphanumeric and underscores only

2. **Email:**
   - Must be unique
   - Valid email format
   - Required for OTP functionality

3. **Password:**
   - Minimum 6 characters
   - Should be hashed before storage

4. **Role:**
   - Must exist in roles table
   - Driver role must be created first

5. **Location Assignment:**
   - Region/Area/Territory must exist
   - Must be within admin's scope

---

## 📝 Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "details": "Detailed error description",
  "field": "fieldName" // if validation error
}
```

### Common Error Codes
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate username/email)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## 🧪 Example Backend Implementation (Node.js/Express)

### Create Driver Endpoint
```javascript
// POST /api/admin/users
router.post('/admin/users', authenticate, authorize(['super_admin', 'regional_admin']), async (req, res) => {
  try {
    const { username, email, password, roleId, regionId, areaId, territoryId, phoneNumber, isActive } = req.body;
    
    // Validation
    if (!username || !email || !password || !roleId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if username/email exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        error: existingUser.username === username ? 'Username already exists' : 'Email already exists' 
      });
    }
    
    // Scope validation (regional_admin can only create in their region)
    if (req.user.role === 'regional_admin' && regionId !== req.user.regionId) {
      return res.status(403).json({ error: 'Cannot create driver outside your region' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({
      username,
      email,
      passwordHash,
      phoneNumber,
      roleId,
      regionId: req.user.role === 'regional_admin' ? req.user.regionId : regionId,
      areaId,
      territoryId,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    });
    
    // Return user (without password)
    const { passwordHash: _, ...userResponse } = user.toJSON();
    res.status(201).json(userResponse);
    
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});
```

### Login Endpoint
```javascript
// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Save OTP
    await OTP.create({
      userId: user.id,
      otp,
      expiresAt: otpExpiry
    });
    
    // Send OTP via email
    await sendOTPEmail(user.email, otp);
    
    res.json({
      otpSent: true,
      userId: user.id,
      message: 'OTP sent to email'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});
```

### Verify OTP Endpoint
```javascript
// POST /api/auth/verify-otp
router.post('/auth/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    // Find OTP record
    const otpRecord = await OTP.findOne({
      where: {
        userId,
        otp,
        expiresAt: { [Op.gt]: new Date() },
        used: false
      }
    });
    
    if (!otpRecord) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }
    
    // Mark OTP as used
    await otpRecord.update({ used: true });
    
    // Get user
    const user = await User.findByPk(userId, {
      include: [{ model: Role }, { model: Region }]
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return token and user
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role.name,
        roleId: user.roleId,
        regionId: user.regionId,
        areaId: user.areaId,
        territoryId: user.territoryId,
        isActive: user.isActive
      }
    });
    
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});
```

### Update Location Endpoint
```javascript
// POST /api/tracking/location
router.post('/tracking/location', authenticate, async (req, res) => {
  try {
    const { truckId, lat, lng, speed, heading } = req.body;
    
    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    
    // Get truck and verify driver owns it
    const truck = await Truck.findByPk(truckId, {
      include: [{ model: FleetAssignment, where: { status: ['picked_up', 'in_transit'] } }]
    });
    
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }
    
    // Check if driver is assigned to this truck
    const assignment = truck.FleetAssignments.find(a => 
      a.driverName === req.user.username || 
      a.driverPhone === req.user.phoneNumber
    );
    
    if (!assignment && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to update this truck location' });
    }
    
    // Rate limiting check (implement Redis or in-memory cache)
    const lastUpdate = await getLastLocationUpdate(truckId);
    if (lastUpdate && Date.now() - lastUpdate < 10000) {
      return res.status(429).json({ error: 'Rate limit exceeded. Maximum 1 update per 10 seconds.' });
    }
    
    // Save location history
    await TruckLocationHistory.create({
      truckId,
      assignmentId: assignment?.id,
      lat,
      lng,
      speed,
      heading,
      timestamp: new Date()
    });
    
    // Update truck current location
    await truck.update({
      currentLat: lat,
      currentLng: lng,
      lastLocationUpdate: new Date()
    });
    
    // Broadcast via Socket.IO
    io.to(`truck:${truckId}`).emit('truck:location:update', {
      truckId,
      assignmentId: assignment?.id,
      orderId: assignment?.orderId,
      lat,
      lng,
      speed,
      heading,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      truckId,
      lat,
      lng,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});
```

---

## ✅ Implementation Checklist

### Backend Tasks
- [ ] Create driver role in database
- [ ] Implement user creation endpoint with validation
- [ ] Implement login endpoint with OTP
- [ ] Implement OTP verification endpoint
- [ ] Implement password hashing (bcrypt)
- [ ] Implement role-based access control
- [ ] Implement location tracking endpoint with rate limiting
- [ ] Implement pickup/delivery endpoints
- [ ] Set up Socket.IO for real-time updates
- [ ] Implement email service for OTP
- [ ] Add database indexes for performance
- [ ] Implement soft delete for users
- [ ] Add audit logging

### Frontend Tasks (Already Done)
- [x] Create driver management UI
- [x] Create driver creation form
- [x] Add routes for driver management
- [x] Update sidebar navigation
- [x] Mobile app login flow
- [x] Mobile app OTP verification

---

## 🎯 Quick Start Guide

1. **Create Driver Role:**
   ```sql
   INSERT INTO roles (name, display_name) VALUES ('driver', 'Driver');
   ```

2. **Create Driver via API:**
   ```bash
   POST /api/admin/users
   Authorization: Bearer <admin-token>
   {
     "username": "driver001",
     "email": "driver@example.com",
     "password": "driver123",
     "roleId": 10,
     "regionId": "uuid",
     "isActive": true
   }
   ```

3. **Driver Logs In:**
   ```bash
   POST /api/auth/login
   {
     "username": "driver001",
     "password": "driver123"
   }
   ```

4. **Driver Verifies OTP:**
   ```bash
   POST /api/auth/verify-otp
   {
     "userId": "uuid",
     "otp": "123456"
   }
   ```

5. **Driver Uses Mobile App:**
   - Views assignments
   - Marks pickup
   - GPS tracking starts automatically
   - Marks delivery
   - GPS tracking stops

---

This documentation provides all the endpoints you need to build the backend for driver management and mobile app integration.

