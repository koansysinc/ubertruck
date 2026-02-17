const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:4000/ws');

ws.on('open', () => {
  console.log('[Test] Connected to WebSocket');

  // Test subscribe
  console.log('[Test] Sending subscribe message...');
  ws.send(JSON.stringify({ type: 'subscribe', bookingId: 'booking-123' }));

  // Test ping after 1 second
  setTimeout(() => {
    console.log('[Test] Sending ping message...');
    ws.send(JSON.stringify({ type: 'ping' }));
  }, 1000);

  // Close after 3 seconds
  setTimeout(() => {
    console.log('[Test] Closing connection...');
    ws.close();
  }, 3000);
});

ws.on('message', (data) => {
  console.log('[Test] Received:', data.toString());
});

ws.on('error', (error) => {
  console.error('[Test] Error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('[Test] Connection closed');
  process.exit(0);
});

console.log('[Test] Attempting to connect to ws://localhost:4000/ws...');