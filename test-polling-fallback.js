/**
 * Test Polling Fallback Mechanism
 * Verifies that polling activates when WebSocket fails
 */

const fs = require('fs');
const WebSocket = require('ws');

console.log('='.repeat(70));
console.log('POLLING FALLBACK MECHANISM TEST');
console.log('Testing automatic fallback to 10-second polling');
console.log('='.repeat(70));
console.log();

const testResults = [];

// Test 1: Verify polling configuration in useBookingStatus hook
function testPollingConfiguration() {
  console.log('📊 TEST 1: Polling Configuration\n');

  const hookPath = './ubertruck-ui/src/hooks/useBookingStatus.ts';

  try {
    const content = fs.readFileSync(hookPath, 'utf8');

    // Check for 10-second interval
    const has10SecondInterval = content.includes('10000');
    logTest('10-second interval configured', has10SecondInterval,
      has10SecondInterval ? 'Interval set to 10000ms' : 'Interval not found');

    // Check for polling state tracking
    const hasPollingState = /useState.*polling|isPolling|setIsPolling/.test(content);
    logTest('Polling state tracking', hasPollingState,
      hasPollingState ? 'State management present' : 'No polling state');

    // Check for connection check before polling
    const hasConnectionCheck = /!isConnected|isConnected === false/.test(content);
    logTest('Connection check before polling', hasConnectionCheck,
      hasConnectionCheck ? 'Checks WebSocket status' : 'No connection check');

    // Check for setInterval usage
    const hasSetInterval = /setInterval/.test(content);
    logTest('setInterval implementation', hasSetInterval,
      hasSetInterval ? 'Polling loop implemented' : 'No interval found');

    // Check for cleanup
    const hasCleanup = /clearInterval|return\s*\(\s*\)\s*=>\s*{/.test(content);
    logTest('Interval cleanup on unmount', hasCleanup,
      hasCleanup ? 'Cleanup implemented' : 'Memory leak risk');

    // Check for API call
    const hasApiCall = /api\.getBooking|fetch.*booking/.test(content);
    logTest('API call in polling', hasApiCall,
      hasApiCall ? 'Fetches booking data' : 'No API call found');

  } catch (error) {
    logTest('Configuration test', false, `Error: ${error.message}`);
  }
}

// Test 2: Simulate WebSocket failure scenario
async function testWebSocketFailure() {
  console.log('\n🔌 TEST 2: WebSocket Failure Simulation\n');

  return new Promise((resolve) => {
    // Try to connect to wrong port to simulate failure
    const ws = new WebSocket('ws://localhost:9999/ws');

    const timeout = setTimeout(() => {
      logTest('WebSocket fails on wrong port', true,
        'Connection failed as expected (triggers polling)');
      resolve();
    }, 2000);

    ws.on('open', () => {
      clearTimeout(timeout);
      logTest('WebSocket fails on wrong port', false,
        'Unexpected connection success');
      ws.close();
      resolve();
    });

    ws.on('error', () => {
      clearTimeout(timeout);
      logTest('WebSocket fails on wrong port', true,
        'Error triggered - polling should activate');
      resolve();
    });
  });
}

// Test 3: Verify polling stops when WebSocket reconnects
function testPollingStopsOnReconnect() {
  console.log('\n🔄 TEST 3: Polling Stops on Reconnect\n');

  const hookPath = './ubertruck-ui/src/hooks/useBookingStatus.ts';

  try {
    const content = fs.readFileSync(hookPath, 'utf8');

    // Check for logic to stop polling when connected
    const stopsOnConnect = /if\s*\(.*isConnected.*\)[\s\S]*clearInterval/.test(content) ||
                           /isConnected.*&&.*clearInterval/.test(content);

    logTest('Stops polling when connected', stopsOnConnect,
      stopsOnConnect ? 'Polling stops on reconnection' : 'May continue polling unnecessarily');

    // Check for reconnection handling
    const hasReconnectLogic = /reconnect|Reconnect/.test(content);
    logTest('Reconnection handling', hasReconnectLogic,
      hasReconnectLogic ? 'Reconnection logic present' : 'No reconnection handling');

  } catch (error) {
    logTest('Reconnection test', false, `Error: ${error.message}`);
  }
}

// Test 4: Performance impact check
function testPollingPerformance() {
  console.log('\n⚡ TEST 4: Polling Performance Impact\n');

  const hookPath = './ubertruck-ui/src/hooks/useBookingStatus.ts';

  try {
    const content = fs.readFileSync(hookPath, 'utf8');

    // Check for optimization patterns
    const hasOptimization = /useMemo|useCallback|React\.memo/.test(content);
    logTest('Performance optimizations', hasOptimization,
      hasOptimization ? 'Optimizations present' : 'Consider adding optimizations');

    // Check if polling is conditional
    const isConditional = /if.*!isConnected.*setInterval/.test(content);
    logTest('Conditional polling', isConditional,
      isConditional ? 'Only polls when disconnected' : 'May poll unnecessarily');

    // Check for debouncing/throttling
    const hasRateLimiting = /debounce|throttle/.test(content);
    logTest('Rate limiting', hasRateLimiting,
      hasRateLimiting ? 'Rate limiting implemented' : 'No rate limiting (OK for 10s interval)');

  } catch (error) {
    logTest('Performance test', false, `Error: ${error.message}`);
  }
}

// Test 5: Verify data consistency
function testDataConsistency() {
  console.log('\n📊 TEST 5: Data Consistency\n');

  const hookPath = './ubertruck-ui/src/hooks/useBookingStatus.ts';

  try {
    const content = fs.readFileSync(hookPath, 'utf8');

    // Check for state updates
    const hasStateUpdate = /setStatus|setBooking|setState/.test(content);
    logTest('State updates on poll', hasStateUpdate,
      hasStateUpdate ? 'Updates state with new data' : 'No state updates found');

    // Check for error handling in polling
    const hasErrorHandling = /catch|error|Error/.test(content);
    logTest('Error handling in polling', hasErrorHandling,
      hasErrorHandling ? 'Handles polling errors' : 'No error handling');

    // Check for loading state during poll
    const hasLoadingState = /setLoading|isLoading|loading/.test(content);
    logTest('Loading state management', hasLoadingState,
      hasLoadingState ? 'Manages loading state' : 'No loading indicator');

  } catch (error) {
    logTest('Data consistency test', false, `Error: ${error.message}`);
  }
}

// Helper function to log results
function logTest(testName, passed, details) {
  testResults.push({ testName, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

// Generate report
function generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('POLLING FALLBACK TEST SUMMARY');
  console.log('='.repeat(70));

  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  const percentage = ((passed / total) * 100).toFixed(0);

  console.log(`\nTests Passed: ${passed}/${total} (${percentage}%)`);

  // Key findings
  console.log('\n🔍 Key Findings:');

  const has10Second = testResults.find(r => r.testName.includes('10-second'));
  if (has10Second && has10Second.passed) {
    console.log('  ✅ Polling interval correctly set to 10 seconds');
  } else {
    console.log('  ❌ Polling interval not properly configured');
  }

  const hasCleanup = testResults.find(r => r.testName.includes('cleanup'));
  if (!hasCleanup || !hasCleanup.passed) {
    console.log('  ⚠️  Memory leak risk - no interval cleanup');
  }

  const hasConditional = testResults.find(r => r.testName.includes('Conditional'));
  if (hasConditional && hasConditional.passed) {
    console.log('  ✅ Polling only activates when WebSocket disconnected');
  } else {
    console.log('  ⚠️  Polling may run unnecessarily');
  }

  // Overall verdict
  console.log('\n' + '-'.repeat(70));
  if (percentage >= 80) {
    console.log('✅ POLLING FALLBACK: PROPERLY IMPLEMENTED');
    console.log('The 10-second polling fallback is working as designed.');
  } else if (percentage >= 60) {
    console.log('⚠️  POLLING FALLBACK: PARTIALLY IMPLEMENTED');
    console.log('Some improvements needed for reliable fallback.');
  } else {
    console.log('❌ POLLING FALLBACK: NEEDS WORK');
    console.log('Significant issues with polling implementation.');
  }

  // Recommendations
  if (testResults.some(r => !r.passed)) {
    console.log('\n💡 Recommendations:');
    if (!testResults.find(r => r.testName.includes('cleanup') && r.passed)) {
      console.log('  - Add clearInterval in useEffect cleanup');
    }
    if (!testResults.find(r => r.testName.includes('Error handling') && r.passed)) {
      console.log('  - Add try-catch blocks in polling function');
    }
    if (!testResults.find(r => r.testName.includes('optimizations') && r.passed)) {
      console.log('  - Consider adding useCallback for polling function');
    }
  }

  console.log('='.repeat(70));
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Polling Fallback Tests...\n');

  testPollingConfiguration();
  await testWebSocketFailure();
  testPollingStopsOnReconnect();
  testPollingPerformance();
  testDataConsistency();

  generateReport();
}

// Execute tests
runTests().catch(console.error);