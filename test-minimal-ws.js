// Minimal test to check if WebSocket upgrade works on the current setup

const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

// Add a regular route for comparison
app.get('/test', (req, res) => {
  res.send('Test route works');
});

// Add WebSocket upgrade listener directly
server.on('upgrade', (request, socket, head) => {
  console.log('[Minimal Test] Upgrade event received! Path:', request.url);
  console.log('[Minimal Test] Headers:', request.headers);

  // Send a simple response (not a real WebSocket handshake, just testing)
  socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
               'Upgrade: websocket\r\n' +
               'Connection: Upgrade\r\n' +
               '\r\n');
});

const PORT = 4002;
server.listen(PORT, () => {
  console.log(`[Minimal Test] Server running on port ${PORT}`);
  console.log(`[Minimal Test] Test regular route: http://localhost:${PORT}/test`);
  console.log(`[Minimal Test] Test WebSocket: ws://localhost:${PORT}/ws`);
});

console.log('[Minimal Test] Starting minimal WebSocket test server...');