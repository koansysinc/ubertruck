/**
 * Standalone WebSocket Server
 * Runs on separate port to bypass Express middleware issues
 */

const http = require('http');
const websocketService = require('./websocket');

function startWebSocketServer(port = 4001) {
  // Create a separate HTTP server for WebSocket
  const wsServer = http.createServer();

  // Initialize WebSocket service on this server
  websocketService.initialize(wsServer);

  // Start listening on the specified port
  wsServer.listen(port, () => {
    console.log(`[WebSocket] Standalone WebSocket server running on port ${port}`);
    console.log(`[WebSocket] Connect to: ws://localhost:${port}/ws`);
  });

  return wsServer;
}

// Export for use in main application
module.exports = { startWebSocketServer };

// If run directly, start the server
if (require.main === module) {
  const port = process.env.WS_PORT || 4001;
  startWebSocketServer(port);
}