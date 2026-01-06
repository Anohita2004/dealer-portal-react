/**
 * Code Validation Script for Live Truck Tracking
 * 
 * This script validates the implementation structure without running the app.
 * Run with: node validate-tracking-implementation.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    results.passed.push(`✅ ${description}: File exists`);
    return true;
  } else {
    results.failed.push(`❌ ${description}: File not found at ${filePath}`);
    return false;
  }
}

function checkFileContent(filePath, checks) {
  if (!fs.existsSync(filePath)) {
    results.failed.push(`❌ File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  checks.forEach(({ pattern, description, required = true }) => {
    const found = pattern.test(content);
    if (found) {
      results.passed.push(`✅ ${description}`);
    } else {
      if (required) {
        results.failed.push(`❌ ${description}`);
      } else {
        results.warnings.push(`⚠️  ${description} (optional)`);
      }
    }
  });
}

console.log('\n🔍 Validating Live Truck Tracking Implementation...\n');

// Check Mobile App Service
console.log('📱 Checking Mobile App Service...');
checkFileContent('mobile-app/services/driverLocationService.js', [
  { pattern: /RATE_LIMIT_MS\s*=\s*10000/, description: 'Rate limit set to 10 seconds' },
  { pattern: /isSending\s*=\s*false/, description: 'Concurrent send protection flag exists' },
  { pattern: /pendingLocation/, description: 'Pending location queue implemented' },
  { pattern: /lastUpdate\s*=\s*now/, description: 'lastUpdate set before send (race condition fix)' },
  { pattern: /error\.response\?\.status\s*===\s*429/, description: 'Rate limit error handling (429)' },
  { pattern: /setTimeout.*RATE_LIMIT_MS|setTimeout\(\(\)\s*=>|pendingLocation.*setTimeout/, description: 'Retry logic after rate limit' }
]);

// Check Frontend Hook
console.log('🎣 Checking Frontend Hook...');
checkFileContent('src/hooks/useLiveLocations.js', [
  { pattern: /onTruckLocationUpdate/, description: 'Socket.IO listener for location updates' },
  { pattern: /setLocations.*prev/, description: 'State update function exists' },
  { pattern: /offTruckLocationUpdate/, description: 'Cleanup function exists' },
  { pattern: /loc\.assignmentId.*data\.assignmentId|data\.truckId.*loc\.truck/, description: 'Location matching logic' }
]);

// Check Map Components
console.log('🗺️  Checking Map Components...');
const mapComponents = [
  'src/components/fleet/TrackingMap.jsx',
  'src/components/fleet/TruckLocationMap.jsx',
  'src/pages/fleet/LiveTrackingMap.jsx'
];

mapComponents.forEach(component => {
  checkFileContent(component, [
    { pattern: /UpdatingMarker/, description: `UpdatingMarker component used in ${path.basename(component)}` },
    { pattern: /markerRef\.current\.setLatLng/, description: `Marker position update logic in ${path.basename(component)}` },
    { pattern: /key.*lat.*lng/, description: `Key includes position in ${path.basename(component)}` }
  ]);
});

// Check Socket Service
console.log('🔌 Checking Socket Service...');
checkFileContent('src/services/socket.js', [
  { pattern: /onTruckLocationUpdate/, description: 'onTruckLocationUpdate function exported' },
  { pattern: /offTruckLocationUpdate/, description: 'offTruckLocationUpdate function exported' },
  { pattern: /truck:location:update/, description: 'Socket event name matches' }
]);

// Check Test Files
console.log('🧪 Checking Test Files...');
checkFileExists('test-tracking-simple.js', 'Node.js test script');
checkFileExists('test-tracking.ps1', 'PowerShell test script');
checkFileExists('LIVE_TRACKING_TEST_GUIDE.md', 'Testing guide');

// Check API Service
console.log('🌐 Checking API Service...');
checkFileContent('src/services/api.js', [
  { pattern: /updateLocation.*\(.*\)|tracking\/location/, description: 'updateLocation API method exists' },
  { pattern: /getLiveLocations/, description: 'getLiveLocations API method exists' }
]);

// Print Results
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION RESULTS');
console.log('='.repeat(60));

if (results.passed.length > 0) {
  console.log('\n✅ PASSED (' + results.passed.length + '):');
  results.passed.forEach(msg => console.log('  ' + msg));
}

if (results.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS (' + results.warnings.length + '):');
  results.warnings.forEach(msg => console.log('  ' + msg));
}

if (results.failed.length > 0) {
  console.log('\n❌ FAILED (' + results.failed.length + '):');
  results.failed.forEach(msg => console.log('  ' + msg));
}

console.log('\n' + '='.repeat(60));

const totalChecks = results.passed.length + results.failed.length;
const passRate = totalChecks > 0 ? (results.passed.length / totalChecks * 100).toFixed(1) : 0;

console.log(`\n📈 Pass Rate: ${passRate}% (${results.passed.length}/${totalChecks})`);

if (results.failed.length === 0) {
  console.log('\n🎉 All critical checks passed! Implementation looks good.');
  console.log('   Proceed with manual testing using TESTING_CHECKLIST.md\n');
} else {
  console.log('\n⚠️  Some checks failed. Please review and fix before testing.\n');
  process.exit(1);
}

