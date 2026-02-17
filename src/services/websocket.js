/**
 * WebSocket Service
 *
 * Manages WebSocket connections for real-time booking updates
 * Following Uber/Rapido pattern for live status tracking
 */

const WebSocket = require('ws');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map<bookingId, Set<WebSocket>>
    this.userConnections = new Map(); // Map<userId, Set<WebSocket>> for notifications
  }

  /**
   * Initialize WebSocket server
   * @param {http.Server} server - Express HTTP server
   */
  initialize(server) {
    console.log('[WebSocket] Initializing WebSocket server');
    console.log('[WebSocket] Server object:', server ? 'Present' : 'Missing');

    // For standalone server, use standard WebSocket with path
    // This will work when not going through Express middleware
    this.wss = new WebSocket.Server({
      server: server,
      path: '/ws',
      perMessageDeflate: false
    });

    console.log('[WebSocket] WebSocket server created on path /ws');

    this.wss.on('connection', (ws) => {
      console.log('[WebSocket] New client connected');

      ws.isAlive = true;
      ws.on('pong', () => { ws.isAlive = true; });

      ws.on('message', (message) => {
        this.handleMessage(ws, message);
      });

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
        this.unsubscribeAll(ws);
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
      });
    });

    // Heartbeat to detect broken connections
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval);
    });

    console.log('[WebSocket] Server initialized');
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'subscribe':
          this.subscribe(ws, data.bookingId);
          break;
        case 'unsubscribe':
          this.unsubscribe(ws, data.bookingId);
          break;
        case 'subscribe_user':
          this.subscribeUser(ws, data.userId);
          break;
        case 'unsubscribe_user':
          this.unsubscribeUser(ws, data.userId);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (error) {
      console.error('[WebSocket] Message parse error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  }

  /**
   * Subscribe client to booking updates
   */
  subscribe(ws, bookingId) {
    if (!bookingId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Booking ID required'
      }));
      return;
    }

    if (!this.clients.has(bookingId)) {
      this.clients.set(bookingId, new Set());
    }

    this.clients.get(bookingId).add(ws);
    console.log(`[WebSocket] Client subscribed to booking ${bookingId}`);

    ws.send(JSON.stringify({
      type: 'subscribed',
      bookingId
    }));
  }

  /**
   * Unsubscribe client from booking updates
   */
  unsubscribe(ws, bookingId) {
    if (this.clients.has(bookingId)) {
      this.clients.get(bookingId).delete(ws);
      if (this.clients.get(bookingId).size === 0) {
        this.clients.delete(bookingId);
      }
    }
    console.log(`[WebSocket] Client unsubscribed from booking ${bookingId}`);
  }

  /**
   * Unsubscribe client from all bookings
   */
  unsubscribeAll(ws) {
    this.clients.forEach((subscribers, bookingId) => {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        this.clients.delete(bookingId);
      }
    });
  }

  /**
   * Broadcast status update to subscribed clients
   */
  broadcastStatusUpdate(bookingId, status, eta = null) {
    const subscribers = this.clients.get(bookingId);
    if (!subscribers || subscribers.size === 0) {
      console.log(`[WebSocket] No subscribers for booking ${bookingId}`);
      return;
    }

    const message = JSON.stringify({
      type: 'status_update',
      bookingId,
      status,
      timestamp: new Date().toISOString(),
      eta
    });

    let sentCount = 0;
    subscribers.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sentCount++;
      }
    });

    console.log(`[WebSocket] Status update sent to ${sentCount} clients for booking ${bookingId}`);
  }

  /**
   * Broadcast location update to subscribed clients
   * PHASE 3: Live tracking implementation
   */
  broadcastLocationUpdate(bookingId, locationData) {
    const subscribers = this.clients.get(bookingId);
    if (!subscribers || subscribers.size === 0) {
      console.log(`[WebSocket] No subscribers for location updates on booking ${bookingId}`);
      return;
    }

    const message = JSON.stringify({
      type: 'location_update',
      bookingId,
      ...locationData,
      timestamp: new Date().toISOString()
    });

    let sentCount = 0;
    subscribers.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sentCount++;
      }
    });

    console.log(`[WebSocket] Location update sent to ${sentCount} clients for booking ${bookingId}`);
  }

  /**
   * Subscribe client to location updates (alias for booking subscription)
   * PHASE 3: Location tracking subscription
   */
  subscribeToLocation(ws, bookingId) {
    this.subscribe(ws, bookingId);

    // Send initial location if available
    ws.send(JSON.stringify({
      type: 'location_subscription_confirmed',
      bookingId,
      message: 'Subscribed to real-time location updates'
    }));
  }

  /**
   * Subscribe user for notifications
   * PHASE 4: Notification system
   */
  subscribeUser(ws, userId) {
    if (!userId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'User ID required'
      }));
      return;
    }

    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }

    this.userConnections.get(userId).add(ws);
    ws.userId = userId; // Store userId on connection for cleanup

    console.log(`[WebSocket] User ${userId} subscribed for notifications`);

    ws.send(JSON.stringify({
      type: 'user_subscribed',
      userId,
      message: 'Subscribed for notifications'
    }));
  }

  /**
   * Unsubscribe user from notifications
   * PHASE 4: Notification system
   */
  unsubscribeUser(ws, userId) {
    if (this.userConnections.has(userId)) {
      this.userConnections.get(userId).delete(ws);
      if (this.userConnections.get(userId).size === 0) {
        this.userConnections.delete(userId);
      }
    }
    console.log(`[WebSocket] User ${userId} unsubscribed from notifications`);
  }

  /**
   * Broadcast notification to specific user
   * PHASE 4: Notification system
   */
  broadcastToUser(userId, message) {
    const userSockets = this.userConnections.get(userId);
    if (!userSockets || userSockets.size === 0) {
      console.log(`[WebSocket] No active connections for user ${userId}`);
      return false;
    }

    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    userSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
        sentCount++;
      }
    });

    console.log(`[WebSocket] Notification sent to ${sentCount} connections for user ${userId}`);
    return sentCount > 0;
  }
}

module.exports = new WebSocketService();