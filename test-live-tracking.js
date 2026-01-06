/**
 * Test Script for Live Truck Tracking
 * Simulates a truck moving along a route and sends location updates
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const TRUCK_ID = '8cf20524-e0be-4589-9572-a9efc37b0bf4'; // From your logs
const UPDATE_INTERVAL = 3000; // 3 seconds (faster than production for testing)

// Login credentials (replace with actual driver credentials)
const DRIVER_CREDENTIALS = {
  username: 'anohita', // Replace with your driver username
  password: 'password123' // Replace with your driver password
};

// Simulate a route: Starting point to destination (Kolkata area based on your logs)
// Lat: 22.540638, Lng: 88.353808 (from your logs)
const START_LAT = 22.540638;
const START_LNG = 88.353808;
const END_LAT = 22.545638;   // ~500m north
const END_LNG = 88.358808;   // ~500m east

const TOTAL_STEPS = 20; // Number of location updates

let token = null;
let currentStep = 0;

// Calculate intermediate points along the route
function getRoutePoint(step) {
  const progress = step / TOTAL_STEPS;
  const lat = START_LAT + (END_LAT - START_LAT) * progress;
  const lng = START_LNG + (END_LNG - START_LNG) * progress;
  
  // Add some random variation to simulate realistic GPS movement
  const jitterLat = (Math.random() - 0.5) * 0.00005; // ~5 meters
  const jitterLng = (Math.random() - 0.5) * 0.00005;
  
  return {
    lat: lat + jitterLat,
    lng: lng + jitterLng
  };
}

// Login and get authentication token
async function login() {
  try {
    console.log('🔐 Logging in as driver...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, DRIVER_CREDENTIALS);
    
    if (response.data.token) {
      token = response.data.token;
      console.log('✅ Login successful!');
      console.log('📍 Token:', token.substring(0, 20) + '...');
      return true;
    } else if (response.data.otpSent) {
      console.error('❌ OTP verification required - please login via mobile app first');
      return false;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Send location update to backend
async function sendLocation(lat, lng, speed = 30, heading = 45) {
  try {
    const locationData = {
      truckId: TRUCK_ID,
      lat: lat,
      lng: lng,
      speed: speed, // km/h
      heading: heading, // degrees
      timestamp: new Date().toISOString()
    };

    const response = await axios.post(
      `${API_BASE_URL}/tracking/location`,
      locationData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`📍 Location sent [${currentStep}/${TOTAL_STEPS}]:`, {
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      speed: `${speed} km/h`
    });

    return true;
  } catch (error) {
    console.error('❌ Error sending location:', error.response?.data || error.message);
    return false;
  }
}

// Main simulation loop
async function simulateMovement() {
  console.log('\n🚚 Starting truck movement simulation...');
  console.log(`📍 Route: (${START_LAT}, ${START_LNG}) → (${END_LAT}, ${END_LNG})`);
  console.log(`⏱️  Updates every ${UPDATE_INTERVAL / 1000} seconds`);
  console.log(`🎯 Total steps: ${TOTAL_STEPS}\n`);

  const interval = setInterval(async () => {
    if (currentStep >= TOTAL_STEPS) {
      console.log('\n✅ Route completed!');
      console.log('🎉 Simulation finished. Check the live tracking map in your browser.');
      clearInterval(interval);
      process.exit(0);
      return;
    }

    const point = getRoutePoint(currentStep);
    const speed = 25 + Math.random() * 15; // 25-40 km/h
    const heading = Math.atan2(END_LNG - START_LNG, END_LAT - START_LAT) * (180 / Math.PI);

    await sendLocation(point.lat, point.lng, speed, heading);
    currentStep++;
  }, UPDATE_INTERVAL);
}

// Main execution
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          Live Truck Tracking - Test Simulator             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n💡 TIP: Make sure you have a valid driver account');
    console.log('💡 Update DRIVER_CREDENTIALS in this script with valid credentials');
    process.exit(1);
  }

  // Step 2: Wait a moment
  console.log('\n⏳ Waiting 2 seconds before starting simulation...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Start simulation
  await simulateMovement();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});

// Run the script
main();
