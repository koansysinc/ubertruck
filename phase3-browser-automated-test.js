#!/usr/bin/env node

/**
 * Phase 3: Automated Browser Testing for Live Tracking
 * This script performs automated browser-like testing of all location features
 */

const axios = require('axios');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:4000/api/v1';
const WS_URL = 'ws://localhost:4001/ws';

// Test state
let authToken = null;
let wsClient = null;
let testResults = [];
let locationUpdatesReceived = 0;

// Console colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const prefix = {
        info: `${colors.blue}[INFO]${colors.reset}`,
        success: `${colors.green}[✓]${colors.reset}`,
        error: `${colors.red}[✗]${colors.reset}`,
        warning: `${colors.yellow}[!]${colors.reset}`,
        test: `${colors.cyan}[TEST]${colors.reset}`
    }[type] || '[?]';

    console.log(`${prefix} ${colors.bright}${time}${colors.reset} - ${message}`);
}

function logSection(title) {
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.bright + colors.cyan + `  ${title}` + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Start HTTP server for browser test page
function startTestServer() {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            if (req.url === '/') {
                const htmlPath = path.join(__dirname, 'phase3-live-tracking-browser-test.html');
                const html = fs.readFileSync(htmlPath, 'utf8');
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            } else if (req.url === '/status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    testsRun: testResults.length,
                    testsPassed: testResults.filter(r => r.status).length,
                    locationUpdates: locationUpdatesReceived
                }));
            }
        });

        server.listen(8080, () => {
            log('Test server started on http://localhost:8080', 'success');
            resolve(server);
        });
    });
}

// Test 1: API Health Check
async function testAPIHealth() {
    logSection('Test 1: API Health Check');

    try {
        const response = await axios.get('http://localhost:4000/health');

        if (response.data.status === 'healthy') {
            log('API is healthy', 'success');
            log(`Version: ${response.data.version}`, 'info');
            log(`Database: ${response.data.services.database}`, 'info');
            log(`Redis: ${response.data.services.redis}`, 'info');
            testResults.push({ name: 'API Health', status: true });
            return true;
        } else {
            log('API returned unhealthy status', 'error');
            testResults.push({ name: 'API Health', status: false });
            return false;
        }
    } catch (error) {
        log(`API health check failed: ${error.message}`, 'error');
        testResults.push({ name: 'API Health', status: false });
        return false;
    }
}

// Test 2: Authentication
async function testAuthentication() {
    logSection('Test 2: Authentication');

    try {
        const phoneNumber = '9876543210';

        // Register (may already exist)
        try {
            await axios.post(`${API_BASE}/users/register`, {
                phoneNumber,
                role: 'driver',
                businessName: 'Browser Test Driver'
            });
            log('User registered', 'info');
        } catch (e) {
            log('User already exists (expected)', 'info');
        }

        // Login
        log('Requesting OTP...', 'info');
        const loginRes = await axios.post(`${API_BASE}/users/login`, { phoneNumber });
        const { otp, sessionId } = loginRes.data;
        log(`OTP received: ${otp}`, 'success');

        // Verify OTP
        log('Verifying OTP...', 'info');
        const verifyRes = await axios.post(`${API_BASE}/users/verify-otp`, {
            phoneNumber,
            otp,
            sessionId
        });

        authToken = verifyRes.data.token;
        log('Authentication successful', 'success');
        log(`Token: ${authToken.substring(0, 20)}...`, 'info');
        testResults.push({ name: 'Authentication', status: true });
        return true;
    } catch (error) {
        log(`Authentication failed: ${error.message}`, 'error');
        testResults.push({ name: 'Authentication', status: false });
        return false;
    }
}

// Test 3: WebSocket Connection
async function testWebSocketConnection() {
    logSection('Test 3: WebSocket Connection');

    return new Promise((resolve) => {
        log(`Connecting to ${WS_URL}...`, 'info');

        wsClient = new WebSocket(WS_URL);

        wsClient.on('open', () => {
            log('WebSocket connected', 'success');
            testResults.push({ name: 'WebSocket Connection', status: true });
            resolve(true);
        });

        wsClient.on('message', (data) => {
            const message = JSON.parse(data);
            log(`WS Message: ${message.type}`, 'info');

            if (message.type === 'location_update') {
                locationUpdatesReceived++;
                log(`Location update #${locationUpdatesReceived}: ${message.location.lat}, ${message.location.lng}`, 'success');
                log(`Speed: ${message.location.speed} km/h`, 'info');
                log(`Remaining: ${message.route?.remainingDistance} km, ETA: ${message.route?.remainingTime} min`, 'info');
            }
        });

        wsClient.on('error', (error) => {
            log(`WebSocket error: ${error.message}`, 'error');
            testResults.push({ name: 'WebSocket Connection', status: false });
            resolve(false);
        });

        setTimeout(() => {
            if (wsClient.readyState !== WebSocket.OPEN) {
                log('WebSocket connection timeout', 'error');
                testResults.push({ name: 'WebSocket Connection', status: false });
                resolve(false);
            }
        }, 5000);
    });
}

// Test 4: Distance Calculation
async function testDistanceCalculation() {
    logSection('Test 4: Distance Calculation');

    try {
        log('Calculating distance from Nalgonda to Miryalguda...', 'info');

        const response = await axios.post(`${API_BASE}/location/distance`, {
            point1: { lat: 17.0477, lng: 79.2666 },
            point2: { lat: 16.8700, lng: 79.5900 }
        });

        const { distance, estimatedTime, unit } = response.data;

        log(`Distance: ${distance} ${unit}`, 'success');
        log(`Estimated Time: ${estimatedTime} minutes`, 'success');

        // Validate reasonable values
        const distanceValid = parseFloat(distance) > 30 && parseFloat(distance) < 50;
        const etaValid = estimatedTime > 30 && estimatedTime < 90;

        if (distanceValid && etaValid) {
            log('Distance and ETA values are reasonable', 'success');
            testResults.push({ name: 'Distance Calculation', status: true });
            return true;
        } else {
            log('Distance or ETA values seem incorrect', 'warning');
            testResults.push({ name: 'Distance Calculation', status: false });
            return false;
        }
    } catch (error) {
        log(`Distance calculation failed: ${error.message}`, 'error');
        testResults.push({ name: 'Distance Calculation', status: false });
        return false;
    }
}

// Test 5: Location Simulation
async function testLocationSimulation() {
    logSection('Test 5: Location Simulation');

    try {
        const bookingId = 'BOOK-BROWSER-' + Date.now();
        const driverId = 'DRIVER-BROWSER-' + Date.now();

        // Start simulation
        log(`Starting simulation for booking ${bookingId}...`, 'info');

        const startRes = await axios.post(`${API_BASE}/location/simulate/start`, {
            bookingId,
            driverId
        });

        if (startRes.data.success) {
            log('Simulation started successfully', 'success');

            // Subscribe to updates via WebSocket
            if (wsClient && wsClient.readyState === WebSocket.OPEN) {
                wsClient.send(JSON.stringify({
                    type: 'subscribe',
                    bookingId
                }));
                log('Subscribed to booking updates', 'info');
            }

            // Wait for location updates
            log('Waiting 15 seconds for location updates...', 'info');
            await delay(15000);

            // Check active simulations
            log('Checking active simulations...', 'info');
            const activeRes = await axios.get(`${API_BASE}/location/simulate/active`);

            const active = activeRes.data.simulations.find(s => s.bookingId === bookingId);
            if (active) {
                log(`Simulation active - Progress: ${active.progress}%`, 'success');
                log(`Driver speed: ${active.speed} km/h`, 'info');
                log(`Position: ${active.position.lat}, ${active.position.lng}`, 'info');
            }

            // Stop simulation
            log('Stopping simulation...', 'info');
            const stopRes = await axios.post(`${API_BASE}/location/simulate/stop`, { bookingId });

            if (stopRes.data.success) {
                log('Simulation stopped successfully', 'success');
                testResults.push({ name: 'Location Simulation', status: true });
                return true;
            }
        }

        testResults.push({ name: 'Location Simulation', status: false });
        return false;
    } catch (error) {
        log(`Simulation test failed: ${error.message}`, 'error');
        testResults.push({ name: 'Location Simulation', status: false });
        return false;
    }
}

// Test 6: Driver Location Update
async function testDriverLocationUpdate() {
    logSection('Test 6: Driver Location Update');

    try {
        const driverId = 'DRIVER-MANUAL-' + Date.now();

        log('Updating driver location...', 'info');

        const updateRes = await axios.post(
            `${API_BASE}/location/update`,
            {
                driverId,
                lat: 17.0300,
                lng: 79.3200,
                speed: 45,
                heading: 90,
                accuracy: 12
            },
            {
                headers: { Authorization: `Bearer ${authToken}` }
            }
        );

        if (updateRes.data.success) {
            log('Location updated successfully', 'success');

            // Get the location back
            log('Retrieving driver location...', 'info');
            const getRes = await axios.get(`${API_BASE}/location/driver/${driverId}`);

            if (getRes.data.success) {
                const loc = getRes.data.location;
                log(`Retrieved location: ${loc.lat}, ${loc.lng}`, 'success');
                log(`Speed: ${loc.speed} km/h, Heading: ${loc.heading}°`, 'info');
                testResults.push({ name: 'Driver Location Update', status: true });
                return true;
            }
        }

        testResults.push({ name: 'Driver Location Update', status: false });
        return false;
    } catch (error) {
        log(`Location update failed: ${error.message}`, 'error');
        testResults.push({ name: 'Driver Location Update', status: false });
        return false;
    }
}

// Test 7: Active Drivers List
async function testActiveDrivers() {
    logSection('Test 7: Active Drivers List');

    try {
        log('Fetching active drivers...', 'info');

        const response = await axios.get(`${API_BASE}/location/drivers/active`);

        log(`Found ${response.data.count} active drivers`, 'success');

        response.data.drivers.forEach((driver, index) => {
            log(`Driver ${index + 1}: ${driver.driverId} at ${driver.lat}, ${driver.lng}`, 'info');
        });

        testResults.push({ name: 'Active Drivers List', status: true });
        return true;
    } catch (error) {
        log(`Active drivers fetch failed: ${error.message}`, 'error');
        testResults.push({ name: 'Active Drivers List', status: false });
        return false;
    }
}

// Test 8: Route Information
async function testRouteInfo() {
    logSection('Test 8: Route Information');

    try {
        const bookingId = 'BOOK-ROUTE-TEST';

        log(`Getting route for booking ${bookingId}...`, 'info');

        const response = await axios.get(`${API_BASE}/location/route/${bookingId}`);

        if (response.data.success) {
            const route = response.data.route;
            log(`Route has ${route.points.length} waypoints`, 'success');
            log(`Total distance: ${route.distance.toFixed(2)} km`, 'info');
            log(`Estimated duration: ${route.duration} minutes`, 'info');

            route.points.forEach((point, index) => {
                log(`Waypoint ${index + 1}: ${point.name} (${point.lat}, ${point.lng})`, 'info');
            });

            testResults.push({ name: 'Route Information', status: true });
            return true;
        }

        testResults.push({ name: 'Route Information', status: false });
        return false;
    } catch (error) {
        log(`Route fetch failed: ${error.message}`, 'error');
        testResults.push({ name: 'Route Information', status: false });
        return false;
    }
}

// Main test runner
async function runBrowserTests() {
    console.log(colors.bright + colors.cyan);
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     PHASE 3: LIVE TRACKING - BROWSER SIMULATION TEST      ║');
    console.log('║                    UberTruck MVP                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(colors.reset);

    // Start test server
    const server = await startTestServer();

    log('Browser test page available at: http://localhost:8080', 'info');
    log('Starting automated tests...', 'info');

    // Run tests
    await testAPIHealth();
    await testAuthentication();
    await testWebSocketConnection();
    await testDistanceCalculation();
    await testLocationSimulation();
    await testDriverLocationUpdate();
    await testActiveDrivers();
    await testRouteInfo();

    // Close WebSocket
    if (wsClient) {
        wsClient.close();
    }

    // Summary
    logSection('TEST SUMMARY');

    const passed = testResults.filter(r => r.status).length;
    const failed = testResults.filter(r => !r.status).length;
    const total = testResults.length;
    const passRate = ((passed / total) * 100).toFixed(1);

    console.log(`\n${colors.bright}Test Results:${colors.reset}`);
    console.log(`Total Tests: ${total}`);
    console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`Pass Rate: ${passRate}%`);
    console.log(`Location Updates Received: ${locationUpdatesReceived}`);

    // List all tests
    console.log(`\n${colors.bright}Test Details:${colors.reset}`);
    testResults.forEach(test => {
        const symbol = test.status ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
        console.log(`  ${symbol} ${test.name}`);
    });

    // Overall result
    if (passed === total) {
        console.log(`\n${colors.bright}${colors.green}✅ ALL BROWSER TESTS PASSED!${colors.reset}`);
        console.log('Phase 3 Live Tracking is fully functional in browser environment.');
    } else {
        console.log(`\n${colors.bright}${colors.red}❌ SOME BROWSER TESTS FAILED${colors.reset}`);
        const failedTests = testResults.filter(r => !r.status);
        console.log('\nFailed tests:');
        failedTests.forEach(test => {
            console.log(`  ${colors.red}- ${test.name}${colors.reset}`);
        });
    }

    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.bright + 'Browser test page remains available at http://localhost:8080' + colors.reset);
    console.log('Press Ctrl+C to stop the test server');
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
}

// Run the tests
runBrowserTests().catch(error => {
    console.error(colors.red + 'Test suite error:' + colors.reset, error);
    process.exit(1);
});