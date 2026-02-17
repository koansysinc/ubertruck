// Simple standalone test to verify WebSocket server works

const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('[WebSocket] New client connected');

  ws.on('message', (message) => {
    console.log('[WebSocket] Received:', message.toString());

    try {
      const data = JSON.parse(message);

      if (data.type === 'subscribe') {
        ws.send(JSON.stringify({ type: 'subscribed', bookingId: data.bookingId }));
      } else if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
    }
  });

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
  });
});

const PORT = 4001;
server.listen(PORT, () => {
  console.log(`Test WebSocket server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});