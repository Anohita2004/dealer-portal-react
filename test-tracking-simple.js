/**
 * Simple Live Tracking Test - Uses existing token from browser
 * 
 * Instructions:
 * 1. Login to the web app as a driver
 * 2. Open browser DevTools → Console
 * 3. Run: localStorage.getItem('token')
 * 4. Copy the token and paste it below
 * 5. Run this script: node test-tracking-simple.js
 */

const axios = require('axios');

// ============ CONFIGURATION ============
const API_BASE_URL = 'http://localhost:3000/api';
const TRUCK_ID = '8cf20524-e0be-4589-9572-a9efc37b0bf4';

// TODO: Paste your token here (get it from browser localStorage)
const AUTH_TOKEN = 'YOUR_TOKEN_HERE';

// Starting location (from your mobile app logs)
const START_LAT = 22.540638;
const START_LNG = 88.353808;
// ========================================

let currentLat = START_LAT;
let currentLng = START_LNG;
let updateCount = 0;

async function sendLocation() {
  try {
    // Move slightly north-east each time (simulating movement)
    currentLat += 0.0001; // ~11 meters north
    currentLng += 0.0001; // ~11 meters east
    
    const locationData = {
      truckId: TRUCK_ID,
      lat: currentLat,
      lng: currentLng,
      speed: 30 + Math.random() * 10,
      heading: 45,
      timestamp: new Date().toISOString()
    };

    const response = await axios.post(
      `${API_BASE_URL}/tracking/location`,
      locationData,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    updateCount++;
    console.log(`✅ [${updateCount}] Location sent:`, {
      lat: currentLat.toFixed(6),
      lng: currentLng.toFixed(6),
      response: response.data
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔑 Token expired or invalid!');
      console.log('📋 Steps to get a new token:');
      console.log('   1. Login to http://localhost:5173');
      console.log('   2. Open DevTools → Console');
      console.log('   3. Run: localStorage.getItem("token")');
      console.log('   4. Copy the token and update AUTH_TOKEN in this script\n');
      process.exit(1);
    }
  }
}

async function main() {
  if (AUTH_TOKEN === 'YOUR_TOKEN_HERE') {
    console.log('\n❌ Please update AUTH_TOKEN in the script!');
    console.log('\n📋 Steps:');
    console.log('   1. Login to http://localhost:5173');
    console.log('   2. Open browser DevTools → Console (F12)');
    console.log('   3. Run: localStorage.getItem("token")');
    console.log('   4. Copy the token');
    console.log('   5. Paste it in this script (replace YOUR_TOKEN_HERE)');
    console.log('   6. Run: node test-tracking-simple.js\n');
    return;
  }

  console.log('\n🚚 Live Tracking Test Started');
  console.log('📍 Truck ID:', TRUCK_ID);
  console.log('📡 Sending location every 11 seconds (respects 10s rate limit)...');
  console.log('🗺️  Open Live Tracking page to see movement!\n');
  console.log('⚠️  Note: Backend rate limit is 10 seconds per update\n');

  // Send immediately
  await sendLocation();

  // Then every 11 seconds (slightly more than rate limit to avoid errors)
  setInterval(sendLocation, 11000);
}

main();
