/**
 * UberTruck MVP - Main Application Entry Point
 * Version: 1.0.0-FROZEN
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Import route handlers
const userRoutes = require('./routes/userRoutes');
const fleetRoutes = require('./routes/fleetRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const routeRoutes = require('./routes/routeRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const keepaliveRoutes = require('./routes/keepalive');
const locationRoutes = require('./routes/locationRoutes');

// Import database and cache connections
const { initializeDatabase } = require('./database/connection');
const { initializeRedis } = require('./config/redis');

// Import logging middleware
const {
  requestIdMiddleware,
  responseInterceptor,
  morganMiddleware,
  performanceMiddleware,
  errorLoggingMiddleware,
  logger
} = require('./middleware/loggingMiddleware');

// Import WebSocket service
const websocketService = require('./services/websocket');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure rate limiter
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});

// Apply logging middleware first (skip for WebSocket)
app.use((req, res, next) => {
  if (req.url === '/ws' && req.headers.upgrade === 'websocket') {
    return next(); // Skip all middleware for WebSocket
  }
  requestIdMiddleware(req, res, next);
});

app.use((req, res, next) => {
  if (req.url === '/ws' && req.headers.upgrade === 'websocket') {
    return next();
  }
  responseInterceptor(req, res, next);
});

app.use((req, res, next) => {
  if (req.url === '/ws' && req.headers.upgrade === 'websocket') {
    return next();
  }
  morganMiddleware(req, res, next);
});

app.use((req, res, next) => {
  if (req.url === '/ws' && req.headers.upgrade === 'websocket') {
    return next();
  }
  performanceMiddleware(req, res, next);
});

// Security and parsing middleware
// Skip helmet for WebSocket upgrade requests
app.use((req, res, next) => {
  // Check if this is a WebSocket upgrade request
  if (req.url === '/ws' && req.headers.upgrade === 'websocket') {
    return next(); // Skip middleware for WebSocket
  }
  helmet()(req, res, next);
});

// CORS configuration for production
const corsOptions = {
  origin: function(origin, callback) {
    // CORS_ORIGIN can be a comma-separated list of origins
    const extraOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : [];

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://ubertruck.vercel.app',
      // Vercel preview URL for current deployment
      'https://ubertruck-29vya4iic-koansysincs-projects.vercel.app',
      ...extraOrigins
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    version: '1.0.0-FROZEN',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: 'connected'
    }
  });
});

// API version endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'UberTruck MVP API',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    endpoints: {
      users: '/api/v1/users',
      fleet: '/api/v1/fleet',
      bookings: '/api/v1/bookings',
      routes: '/api/v1/routes',
      payments: '/api/v1/payments',
      admin: '/api/v1/admin'
    }
  });
});

// Mount routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/fleet', fleetRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/routes', routeRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/keepalive', keepaliveRoutes);
app.use('/api/v1/location', locationRoutes);

// Phase 4: Notification routes
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/v1/notifications', notificationRoutes);

// Driver routes
const driverRoutes = require('./routes/driverRoutes');
app.use('/api/v1/drivers', driverRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: {
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
      status: err.status || 500
    }
  });
});

// 404 handler (skip for WebSocket)
app.use((req, res) => {
  // Don't send 404 for WebSocket upgrade requests
  if (req.url === '/ws' && req.headers.upgrade === 'websocket') {
    return; // Let the upgrade event handle it
  }
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database connection established');

    // Initialize Redis
    await initializeRedis();
    logger.info('Redis connection established');

    // Create HTTP server
    const http = require('http');
    const server = http.createServer(app);

    // Start WebSocket on separate port to avoid Express middleware conflicts
    const { startWebSocketServer } = require('./services/websocket-server');
    const wsPort = process.env.WS_PORT || 4001;
    startWebSocketServer(wsPort);

    // Start listening
    server.listen(PORT, () => {
      logger.info(`UberTruck MVP Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Version: 1.0.0-FROZEN`);
      logger.info('Corridor: Nalgonda-Miryalguda');
      logger.info('Pricing: ₹5/tonne/km (FROZEN)');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing server');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing server');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;