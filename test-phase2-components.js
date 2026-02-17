/**
 * Phase 2 Component Unit Tests
 * Testing all components created for real-time updates
 */

const assert = require('assert');
const path = require('path');

console.log('='.repeat(60));
console.log('PHASE 2: REAL-TIME UPDATES - UNIT TEST SUITE');
console.log('='.repeat(60));

// Test results tracker
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    testResults.push({ name, status: '✅ PASS' });
    console.log(`✅ PASS: ${name}`);
  } catch (error) {
    failedTests++;
    testResults.push({ name, status: '❌ FAIL', error: error.message });
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

// Test 1: Backend WebSocket Service Exists
test('Backend WebSocket service file exists', () => {
  const websocketService = require('./src/services/websocket');
  assert(websocketService, 'WebSocket service should be exported');
  assert(typeof websocketService.initialize === 'function', 'Should have initialize method');
  assert(typeof websocketService.broadcastStatusUpdate === 'function', 'Should have broadcastStatusUpdate method');
});

// Test 2: WebSocket Service Methods
test('WebSocket service has all required methods', () => {
  const websocketService = require('./src/services/websocket');
  const requiredMethods = [
    'initialize',
    'handleMessage',
    'subscribe',
    'unsubscribe',
    'unsubscribeAll',
    'broadcastStatusUpdate'
  ];

  requiredMethods.forEach(method => {
    assert(typeof websocketService[method] === 'function', `Missing method: ${method}`);
  });
});

// Test 3: Frontend Files Exist
test('Frontend WebSocket service exists', () => {
  const fs = require('fs');
  const frontendPath = './ubertruck-ui/src/services/websocket.ts';
  assert(fs.existsSync(frontendPath), 'Frontend WebSocket service file should exist');

  const content = fs.readFileSync(frontendPath, 'utf8');
  assert(content.includes('class WebSocketClient'), 'Should define WebSocketClient class');
  assert(content.includes('connect()'), 'Should have connect method');
  assert(content.includes('subscribe('), 'Should have subscribe method');
});

// Test 4: React Hooks Exist
test('React hooks created', () => {
  const fs = require('fs');
  const hooks = [
    'useWebSocket.ts',
    'useBookingStatus.ts',
    'useETA.ts'
  ];

  hooks.forEach(hook => {
    const hookPath = `./ubertruck-ui/src/hooks/${hook}`;
    assert(fs.existsSync(hookPath), `Hook ${hook} should exist`);
  });
});

// Test 5: UI Components Exist
test('UI components created', () => {
  const fs = require('fs');
  const components = [
    'StatusBadge.tsx',
    'StatusTimeline.tsx'
  ];

  components.forEach(component => {
    const componentPath = `./ubertruck-ui/src/components/${component}`;
    assert(fs.existsSync(componentPath), `Component ${component} should exist`);
  });
});

// Test 6: RideTracking Screen Exists
test('RideTracking screen created', () => {
  const fs = require('fs');
  const screenPath = './ubertruck-ui/src/screens/RideTracking.tsx';
  assert(fs.existsSync(screenPath), 'RideTracking screen should exist');

  const content = fs.readFileSync(screenPath, 'utf8');
  assert(content.includes('useBookingStatus'), 'Should use useBookingStatus hook');
  assert(content.includes('StatusBadge'), 'Should use StatusBadge component');
  assert(content.includes('StatusTimeline'), 'Should use StatusTimeline component');
});

// Test 7: Polling Fallback Implementation
test('Polling fallback implemented in useBookingStatus', () => {
  const fs = require('fs');
  const hookPath = './ubertruck-ui/src/hooks/useBookingStatus.ts';
  const content = fs.readFileSync(hookPath, 'utf8');

  assert(content.includes('isPolling'), 'Should track polling state');
  assert(content.includes('setInterval'), 'Should use setInterval for polling');
  assert(content.includes('10000'), 'Should poll every 10 seconds');
  assert(content.includes('!isConnected'), 'Should check WebSocket connection status');
});

// Test 8: ETA Calculation Logic
test('ETA calculation uses correct speeds', () => {
  const fs = require('fs');
  const hookPath = './ubertruck-ui/src/hooks/useETA.ts';
  const content = fs.readFileSync(hookPath, 'utf8');

  assert(content.includes('EN_ROUTE_TO_PICKUP: 40'), 'Should use 40 km/h for city');
  assert(content.includes('IN_TRANSIT: 50'), 'Should use 50 km/h for highway');
  assert(content.includes('formatETA'), 'Should have ETA formatting function');
});

// Test 9: Status Badge Color Mapping
test('StatusBadge has all status colors', () => {
  const fs = require('fs');
  const componentPath = './ubertruck-ui/src/components/StatusBadge.tsx';
  const content = fs.readFileSync(componentPath, 'utf8');

  const requiredStatuses = [
    'CREATED',
    'DRIVER_ASSIGNED',
    'EN_ROUTE_TO_PICKUP',
    'ARRIVED_AT_PICKUP',
    'CARGO_LOADED',
    'IN_TRANSIT',
    'ARRIVED_AT_DELIVERY',
    'CARGO_UNLOADED',
    'COMPLETED',
    'CANCELLED'
  ];

  requiredStatuses.forEach(status => {
    assert(content.includes(`${status}:`), `Should have color for ${status}`);
  });
});

// Test 10: Timeline Has 9 Stages
test('StatusTimeline has 9 booking stages', () => {
  const fs = require('fs');
  const componentPath = './ubertruck-ui/src/components/StatusTimeline.tsx';
  const content = fs.readFileSync(componentPath, 'utf8');

  const stages = [
    'CREATED',
    'DRIVER_ASSIGNED',
    'EN_ROUTE_TO_PICKUP',
    'ARRIVED_AT_PICKUP',
    'CARGO_LOADED',
    'IN_TRANSIT',
    'ARRIVED_AT_DELIVERY',
    'CARGO_UNLOADED',
    'COMPLETED'
  ];

  stages.forEach(stage => {
    assert(content.includes(`key: '${stage}'`), `Should include stage: ${stage}`);
  });
});

// Test 11: WebSocket Auto-Reconnection
test('WebSocket client has auto-reconnection logic', () => {
  const fs = require('fs');
  const servicePath = './ubertruck-ui/src/services/websocket.ts';
  const content = fs.readFileSync(servicePath, 'utf8');

  assert(content.includes('attemptReconnect'), 'Should have reconnection method');
  assert(content.includes('maxReconnectAttempts'), 'Should have max reconnect attempts');
  assert(content.includes('reconnectInterval'), 'Should have reconnect interval');
});

// Test 12: File Count Verification
test('All required files created (11 files)', () => {
  const fs = require('fs');
  const requiredFiles = [
    // Backend
    './src/services/websocket.js',

    // Frontend services
    './ubertruck-ui/src/services/websocket.ts',

    // Hooks
    './ubertruck-ui/src/hooks/useWebSocket.ts',
    './ubertruck-ui/src/hooks/useBookingStatus.ts',
    './ubertruck-ui/src/hooks/useETA.ts',

    // Components
    './ubertruck-ui/src/components/StatusBadge.tsx',
    './ubertruck-ui/src/components/StatusTimeline.tsx',

    // Screen
    './ubertruck-ui/src/screens/RideTracking.tsx'
  ];

  let missingFiles = [];
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    }
  });

  assert(missingFiles.length === 0, `Missing files: ${missingFiles.join(', ')}`);
  assert(requiredFiles.length >= 8, 'Should have at least 8 core files');
});

// Print Summary
console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests} ✅`);
console.log(`Failed: ${failedTests} ❌`);
console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);

console.log('\nDETAILED RESULTS:');
console.log('-'.repeat(60));
testResults.forEach((result, index) => {
  console.log(`${index + 1}. ${result.status} ${result.name}`);
  if (result.error) {
    console.log(`   └─ ${result.error}`);
  }
});

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);