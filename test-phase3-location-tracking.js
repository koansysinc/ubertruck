#!/usr/bin/env node

/**
 * Phase 3: Live Tracking API Test Suite
 * Tests all location-related endpoints and simulation
 */

const axios = require('axios');
const WebSocket = require('ws');
const colors = require('colors');

const API_BASE = 'http://localhost:4000/api/v1';
const WS_URL = 'ws://localhost:4001/ws';

// Test data
const testDriver = {
  phoneNumber: '9876543210',
  role: 'driver',
  businessName: 'Test Driver'
};

const testShipper = {
  phoneNumber: '9876543211',
  role: 'shipper',
  businessName: 'Test Shipper'
};

let driverToken = null;
let shipperToken = null;
let testBookingId = 'BOOK-TEST-' + Date.now();
let testDriverId = 'DRIVER-TEST-' + Date.now();

// Test results
const testResults = [];

function logTest(name, status, details = '') {
  const statusSymbol = status ? '✅' : '❌';
  const statusText = status ? 'PASS'.green : 'FAIL'.red;
  console.log(`${statusSymbol} ${name}: ${statusText} ${details}`);
  testResults.push({ name, status, details });
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(title.cyan.bold);
  console.log('='.repeat(60));
}

// Helper function to get auth token
async function getAuthToken(phoneNumber, role) {
  try {
    // Register/login
    await axios.post(`${API_BASE}/users/register`, {
      phoneNumber,
      role,
      businessName: `Test ${role}`
    }).catch(() => {}); // Ignore if already exists

    // Request OTP
    const loginRes = await axios.post(`${API_BASE}/users/login`, { phoneNumber });
    const { otp, sessionId } = loginRes.data;

    // Verify OTP
    const verifyRes = await axios.post(`${API_BASE}/users/verify-otp`, {
      phoneNumber,
      otp,
      sessionId
    });

    return verifyRes.data.token;
  } catch (error) {
    console.error('Auth error:', error.response?.data || error.message);
    return null;
  }
}

// Test 1: Distance Calculation
async function testDistanceCalculation() {
  logSection('TEST 1: Distance Calculation');

  try {
    const response = await axios.post(`${API_BASE}/location/distance`, {
      point1: { lat: 17.0477, lng: 79.2666 },  // Nalgonda
      point2: { lat: 16.8700, lng: 79.5900 }   // Miryalguda
    });

    const { distance, estimatedTime } = response.data;

    logTest('Calculate distance endpoint', true,
      `Distance: ${distance} km, ETA: ${estimatedTime} minutes`);

    // Verify reasonable values
    const distanceValid = parseFloat(distance) > 30 && parseFloat(distance) < 50;
    logTest('Distance validation', distanceValid,
      `Distance ${distance} km is within expected range (30-50 km)`);

    const etaValid = estimatedTime > 30 && estimatedTime < 90;
    logTest('ETA validation', etaValid,
      `ETA ${estimatedTime} minutes is within expected range (30-90 min)`);

    return true;
  } catch (error) {
    logTest('Distance calculation', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

// Test 2: Update Driver Location
async function testUpdateLocation() {
  logSection('TEST 2: Update Driver Location');

  if (!driverToken) {
    logTest('Driver authentication', false, 'No auth token');
    return false;
  }

  try {
    const locationData = {
      driverId: testDriverId,
      lat: 17.0477,
      lng: 79.2666,
      heading: 45,
      speed: 40,
      accuracy: 10
    };

    const response = await axios.post(
      `${API_BASE}/location/update`,
      locationData,
      {
        headers: { Authorization: `Bearer ${driverToken}` }
      }
    );

    logTest('Update location endpoint', response.data.success,
      'Location updated successfully');

    // Verify location data
    const location = response.data.location;
    logTest('Location data validation',
      location.lat === locationData.lat && location.lng === locationData.lng,
      `Position: ${location.lat}, ${location.lng}`);

    return true;
  } catch (error) {
    logTest('Update location', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

// Test 3: Get Driver Location
async function testGetDriverLocation() {
  logSection('TEST 3: Get Driver Location');

  try {
    const response = await axios.get(`${API_BASE}/location/driver/${testDriverId}`);

    logTest('Get driver location endpoint', response.data.success,
      'Location retrieved successfully');

    const location = response.data.location;
    logTest('Location data present',
      location && location.lat && location.lng,
      `Driver at: ${location?.lat}, ${location?.lng}`);

    logTest('Location timestamp',
      location && location.timestamp,
      `Last updated: ${location?.timestamp}`);

    return true;
  } catch (error) {
    logTest('Get driver location', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

// Test 4: Get Active Drivers
async function testGetActiveDrivers() {
  logSection('TEST 4: Get Active Drivers');

  try {
    const response = await axios.get(`${API_BASE}/location/drivers/active`);

    logTest('Get active drivers endpoint', response.data.success,
      `Found ${response.data.count} active drivers`);

    const hasTestDriver = response.data.drivers.some(d => d.driverId === testDriverId);
    logTest('Test driver in active list', hasTestDriver,
      hasTestDriver ? 'Test driver found' : 'Test driver not found');

    return true;
  } catch (error) {
    logTest('Get active drivers', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

// Test 5: Start Location Simulation
async function testStartSimulation() {
  logSection('TEST 5: Start Location Simulation');

  try {
    const response = await axios.post(`${API_BASE}/location/simulate/start`, {
      bookingId: testBookingId,
      driverId: testDriverId
    });

    logTest('Start simulation endpoint', response.data.success,
      'Simulation started successfully');

    return true;
  } catch (error) {
    logTest('Start simulation', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

// Test 6: Get Active Simulations
async function testGetActiveSimulations() {
  logSection('TEST 6: Get Active Simulations');

  try {
    const response = await axios.get(`${API_BASE}/location/simulate/active`);

    logTest('Get active simulations endpoint', response.data.success,
      `Found ${response.data.count} active simulations`);

    const hasTestSimulation = response.data.simulations.some(s => s.bookingId === testBookingId);
    logTest('Test simulation active', hasTestSimulation,
      hasTestSimulation ? 'Test simulation found' : 'Test simulation not found');

    if (hasTestSimulation) {
      const sim = response.data.simulations.find(s => s.bookingId === testBookingId);
      logTest('Simulation progress', sim.progress >= 0,
        `Progress: ${sim.progress}%, Speed: ${sim.speed} km/h`);
    }

    return true;
  } catch (error) {
    logTest('Get active simulations', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

// Test 7: WebSocket Location Updates
async function testWebSocketLocationUpdates() {
  logSection('TEST 7: WebSocket Location Updates');

  return new Promise((resolve) => {
    let updateReceived = false;
    let wsConnected = false;

    const ws = new WebSocket(WS_URL);

    const timeout = setTimeout(() => {
      if (!updateReceived) {
        logTest('WebSocket location updates', false, 'No updates received in 15 seconds');
      }
      ws.close();
      resolve(updateReceived);
    }, 15000);

    ws.on('open', () => {
      wsConnected = true;
      logTest('WebSocket connection', true, 'Connected to ws://localhost:4001/ws');

      // Subscribe to booking updates
      ws.send(JSON.stringify({
        type: 'subscribe',
        bookingId: testBookingId
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);

        if (message.type === 'subscribed') {
          logTest('WebSocket subscription', true, `Subscribed to ${message.bookingId}`);
        }

        if (message.type === 'location_update') {
          updateReceived = true;
          logTest('Location update received', true,
            `Driver at: ${message.location.lat.toFixed(6)}, ${message.location.lng.toFixed(6)}`);

          logTest('Location data complete',
            message.location && message.route,
            `Speed: ${message.location.speed} km/h, Remaining: ${message.route?.remainingDistance} km`);

          clearTimeout(timeout);
          ws.close();
          resolve(true);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('error', (error) => {
      logTest('WebSocket connection', false, error.message);
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

// Test 8: Get Route
async function testGetRoute() {
  logSection('TEST 8: Get Route Information');

  try {
    const response = await axios.get(`${API_BASE}/location/route/${testBookingId}`);

    logTest('Get route endpoint', response.data.success,
      'Route retrieved successfully');

    const route = response.data.route;
    logTest('Route data validation',
      route && route.points && route.points.length > 0,
      `Route has ${route?.points?.length} waypoints`);

    logTest('Route distance',
      route && route.distance > 0,
      `Total distance: ${route?.distance?.toFixed(2)} km`);

    return true;
  } catch (error) {
    logTest('Get route', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

// Test 9: Stop Simulation
async function testStopSimulation() {
  logSection('TEST 9: Stop Location Simulation');

  try {
    const response = await axios.post(`${API_BASE}/location/simulate/stop`, {
      bookingId: testBookingId
    });

    logTest('Stop simulation endpoint', response.data.success,
      'Simulation stopped successfully');

    // Verify simulation is stopped
    const activeRes = await axios.get(`${API_BASE}/location/simulate/active`);
    const stillActive = activeRes.data.simulations.some(s => s.bookingId === testBookingId);

    logTest('Simulation stopped verification', !stillActive,
      stillActive ? 'Simulation still active' : 'Simulation successfully stopped');

    return true;
  } catch (error) {
    logTest('Stop simulation', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗'.cyan);
  console.log('║          PHASE 3: LIVE TRACKING TEST SUITE                ║'.cyan.bold);
  console.log('║                 UberTruck MVP                              ║'.cyan);
  console.log('╚════════════════════════════════════════════════════════════╝'.cyan);

  // Get auth tokens
  logSection('SETUP: Authentication');
  driverToken = await getAuthToken(testDriver.phoneNumber, testDriver.role);
  shipperToken = await getAuthToken(testShipper.phoneNumber, testShipper.role);

  logTest('Driver authentication', !!driverToken, driverToken ? 'Token received' : 'Failed');
  logTest('Shipper authentication', !!shipperToken, shipperToken ? 'Token received' : 'Failed');

  // Run tests
  await testDistanceCalculation();
  await testUpdateLocation();
  await testGetDriverLocation();
  await testGetActiveDrivers();
  await testStartSimulation();

  // Wait for simulation to generate some data
  console.log('\nWaiting 6 seconds for simulation to generate location data...'.yellow);
  await new Promise(resolve => setTimeout(resolve, 6000));

  await testGetActiveSimulations();
  await testWebSocketLocationUpdates();
  await testGetRoute();
  await testStopSimulation();

  // Summary
  logSection('TEST SUMMARY');
  const passed = testResults.filter(t => t.status).length;
  const failed = testResults.filter(t => !t.status).length;
  const total = testResults.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`\nTotal Tests: ${total}`);
  console.log(`Passed: ${passed}`.green);
  console.log(`Failed: ${failed}`.red);
  console.log(`Pass Rate: ${passRate}%`.bold);

  if (passRate >= 80) {
    console.log('\n✅ Phase 3 Live Tracking Tests PASSED!'.green.bold);
  } else {
    console.log('\n❌ Phase 3 Live Tracking Tests FAILED'.red.bold);
  }

  // Detailed failures
  if (failed > 0) {
    console.log('\n' + 'Failed Tests:'.red.underline);
    testResults.filter(t => !t.status).forEach(t => {
      console.log(`  - ${t.name}: ${t.details}`.red);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});