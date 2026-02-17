const WebSocket = require('ws');

// Try without the path first
const ws = new WebSocket('ws://localhost:4000');

ws.on('open', () => {
  console.log('[Test] Connected to WebSocket (no path)');
  ws.close();
});

ws.on('error', (error) => {
  console.error('[Test] Error on no-path:', error.message);

  // Now try with /ws path
  const ws2 = new WebSocket('ws://localhost:4000/ws');

  ws2.on('open', () => {
    console.log('[Test] Connected to WebSocket (/ws path)');
    ws2.close();
    process.exit(0);
  });

  ws2.on('error', (error) => {
    console.error('[Test] Error on /ws path:', error.message);
    process.exit(1);
  });
});