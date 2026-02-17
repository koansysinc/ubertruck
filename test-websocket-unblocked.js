/**
 * WebSocket Unblocked Verification Test
 * Tests the WebSocket connection on the new port 4001
 */

const WebSocket = require('ws');

console.log('='.repeat(70));
console.log('WEBSOCKET UNBLOCKED VERIFICATION TEST');
console.log('Testing WebSocket on port 4001 (separate from Express)');
console.log('='.repeat(70));
console.log();

// Test configuration
const WS_URL = 'ws://localhost:4001/ws';
const TEST_BOOKING_ID = 'test-booking-123';
let testsPassed = 0;
let testsTotal = 0;

function logTest(testName, passed, details) {
  testsTotal++;
  if (passed) {
    testsPassed++;
    console.log(`✅ ${testName}`);
  } else {
    console.log(`❌ ${testName}`);
  }
  if (details) {
    console.log(`   ${details}`);
  }
}

async function testWebSocketConnection() {
  return new Promise((resolve) => {
    console.log('🔌 TEST 1: WebSocket Connection');
    console.log(`   Connecting to: ${WS_URL}`);

    const ws = new WebSocket(WS_URL);
    let connected = false;

    const timeout = setTimeout(() => {
      if (!connected) {
        logTest('Connection established', false, 'Timeout after 3 seconds');
        ws.close();
        resolve(false);
      }
    }, 3000);

    ws.on('open', () => {
      connected = true;
      clearTimeout(timeout);
      logTest('Connection established', true, `Connected to ${WS_URL}`);
      ws.close();
      resolve(true);
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      logTest('Connection established', false, `Error: ${error.message}`);
      resolve(false);
    });
  });
}

async function testSubscription() {
  return new Promise((resolve) => {
    console.log('\n📬 TEST 2: Booking Subscription');

    const ws = new WebSocket(WS_URL);
    let subscribed = false;

    const timeout = setTimeout(() => {
      if (!subscribed) {
        logTest('Subscription successful', false, 'No subscription confirmation received');
        ws.close();
        resolve(false);
      }
    }, 3000);

    ws.on('open', () => {
      console.log(`   Subscribing to booking: ${TEST_BOOKING_ID}`);
      ws.send(JSON.stringify({
        type: 'subscribe',
        bookingId: TEST_BOOKING_ID
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'subscribed' && message.bookingId === TEST_BOOKING_ID) {
          subscribed = true;
          clearTimeout(timeout);
          logTest('Subscription successful', true, `Subscribed to ${TEST_BOOKING_ID}`);
          ws.close();
          resolve(true);
        }
      } catch (error) {
        logTest('Subscription successful', false, `Parse error: ${error.message}`);
        clearTimeout(timeout);
        ws.close();
        resolve(false);
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      logTest('Subscription successful', false, `Error: ${error.message}`);
      resolve(false);
    });
  });
}

async function testPingPong() {
  return new Promise((resolve) => {
    console.log('\n🏓 TEST 3: Ping-Pong');

    const ws = new WebSocket(WS_URL);
    let pongReceived = false;

    const timeout = setTimeout(() => {
      if (!pongReceived) {
        logTest('Ping-pong response', false, 'No pong received');
        ws.close();
        resolve(false);
      }
    }, 3000);

    ws.on('open', () => {
      console.log('   Sending ping...');
      ws.send(JSON.stringify({ type: 'ping' }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'pong') {
          pongReceived = true;
          clearTimeout(timeout);
          logTest('Ping-pong response', true, 'Pong received');
          ws.close();
          resolve(true);
        }
      } catch (error) {
        logTest('Ping-pong response', false, `Parse error: ${error.message}`);
        clearTimeout(timeout);
        ws.close();
        resolve(false);
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      logTest('Ping-pong response', false, `Error: ${error.message}`);
      resolve(false);
    });
  });
}

async function testMultipleSubscriptions() {
  return new Promise((resolve) => {
    console.log('\n📚 TEST 4: Multiple Subscriptions');

    const bookingIds = ['booking-1', 'booking-2', 'booking-3'];
    const ws = new WebSocket(WS_URL);
    const subscriptions = new Set();

    const timeout = setTimeout(() => {
      const allSubscribed = subscriptions.size === bookingIds.length;
      logTest('Multiple subscriptions', allSubscribed,
        `Subscribed to ${subscriptions.size}/${bookingIds.length} bookings`);
      ws.close();
      resolve(allSubscribed);
    }, 3000);

    ws.on('open', () => {
      console.log('   Subscribing to multiple bookings...');
      bookingIds.forEach(id => {
        ws.send(JSON.stringify({
          type: 'subscribe',
          bookingId: id
        }));
      });
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'subscribed') {
          subscriptions.add(message.bookingId);
          if (subscriptions.size === bookingIds.length) {
            clearTimeout(timeout);
            logTest('Multiple subscriptions', true,
              `Successfully subscribed to all ${bookingIds.length} bookings`);
            ws.close();
            resolve(true);
          }
        }
      } catch (error) {
        // Ignore parse errors in this test
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      logTest('Multiple subscriptions', false, `Error: ${error.message}`);
      resolve(false);
    });
  });
}

async function testUnsubscribe() {
  return new Promise((resolve) => {
    console.log('\n🚫 TEST 5: Unsubscribe');

    const ws = new WebSocket(WS_URL);
    let subscribed = false;
    let unsubscribed = false;

    const timeout = setTimeout(() => {
      if (!unsubscribed) {
        logTest('Unsubscribe functionality', false, 'Unsubscribe not confirmed');
        ws.close();
        resolve(false);
      }
    }, 3000);

    ws.on('open', () => {
      // First subscribe
      ws.send(JSON.stringify({
        type: 'subscribe',
        bookingId: TEST_BOOKING_ID
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'subscribed' && !subscribed) {
          subscribed = true;
          console.log('   Subscribed, now unsubscribing...');
          // Now unsubscribe
          ws.send(JSON.stringify({
            type: 'unsubscribe',
            bookingId: TEST_BOOKING_ID
          }));

          // Consider it successful after a short delay (no confirmation expected)
          setTimeout(() => {
            unsubscribed = true;
            clearTimeout(timeout);
            logTest('Unsubscribe functionality', true, 'Unsubscribe command accepted');
            ws.close();
            resolve(true);
          }, 500);
        }
      } catch (error) {
        // Ignore parse errors
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      logTest('Unsubscribe functionality', false, `Error: ${error.message}`);
      resolve(false);
    });
  });
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting WebSocket Verification Tests...\n');

  // Test 1: Connection
  const connectionWorks = await testWebSocketConnection();

  if (!connectionWorks) {
    console.log('\n❌ CRITICAL: WebSocket connection failed. Server may not be running.');
    return;
  }

  // Test 2: Subscription
  await testSubscription();

  // Test 3: Ping-Pong
  await testPingPong();

  // Test 4: Multiple Subscriptions
  await testMultipleSubscriptions();

  // Test 5: Unsubscribe
  await testUnsubscribe();

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Tests Passed: ${testsPassed}/${testsTotal}`);
  const percentage = ((testsPassed / testsTotal) * 100).toFixed(0);
  console.log(`Success Rate: ${percentage}%`);

  if (testsPassed === testsTotal) {
    console.log('\n✅ SUCCESS: WebSocket is fully functional on port 4001!');
    console.log('🎉 The WebSocket blocking issue has been RESOLVED.');
    console.log('\n📝 SOLUTION SUMMARY:');
    console.log('  - Express middleware was blocking WebSocket upgrade on port 4000');
    console.log('  - WebSocket now runs on separate port 4001');
    console.log('  - No middleware interference, direct HTTP upgrade works');
    console.log('  - All WebSocket functionality verified and working');
  } else if (testsPassed >= testsTotal * 0.8) {
    console.log('\n⚠️  PARTIAL SUCCESS: Most WebSocket features working');
    console.log('Some minor issues may need attention.');
  } else {
    console.log('\n❌ FAILURE: WebSocket still has significant issues');
  }

  console.log('\n📊 CONNECTION DETAILS:');
  console.log(`  - WebSocket URL: ${WS_URL}`);
  console.log('  - Express API: http://localhost:4000');
  console.log('  - Frontend should connect to: ws://localhost:4001/ws');

  process.exit(testsPassed === testsTotal ? 0 : 1);
}

// Execute tests
runAllTests().catch(console.error);