/**
 * Request/Response Logging Middleware
 * Comprehensive logging with context preservation and sensitive data masking
 */

const morgan = require('morgan');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Configure winston logger with multiple transports
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ubertruck-api' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.uncolorize()
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      format: winston.format.uncolorize()
    }),
    // API access log
    new winston.transports.File({
      filename: 'logs/access.log',
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 30,
      format: winston.format.uncolorize()
    })
  ]
});

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom token to mask sensitive data
morgan.token('body', (req) => {
  if (!req.body) return '-';

  // Clone body to avoid modifying original
  const body = { ...req.body };

  // Mask sensitive fields
  const sensitiveFields = ['password', 'otp', 'token', 'cardNumber', 'cvv', 'pin'];
  sensitiveFields.forEach(field => {
    if (body[field]) {
      body[field] = '***MASKED***';
    }
  });

  return JSON.stringify(body);
});

// Custom token for response body (limited to 1000 chars)
morgan.token('res-body', (req, res) => {
  if (!res._body) return '-';
  const body = typeof res._body === 'string'
    ? res._body
    : JSON.stringify(res._body);
  return body.length > 1000 ? body.substring(0, 1000) + '...' : body;
});

// Custom token for request ID
morgan.token('request-id', (req) => req.requestId);

// Custom token for user ID
morgan.token('user-id', (req) => req.user?.userId || 'anonymous');

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
  if (!req._startTime) return '-';
  // req._startTime is already an hrtime value from requestIdMiddleware
  try {
    const hrtime = process.hrtime(req._startTime);
    const responseTime = hrtime[0] * 1000 + hrtime[1] / 1000000;
    return responseTime.toFixed(3);
  } catch (e) {
    // If there's an error, just return a dash
    return '-';
  }
});

// Request ID middleware - must be first
const requestIdMiddleware = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  req._startTime = process.hrtime();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// Response interceptor to capture response body
const responseInterceptor = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;

  res.send = function(data) {
    res._body = data;
    logApiCall(req, res, data);
    originalSend.call(this, data);
  };

  res.json = function(data) {
    res._body = data;
    logApiCall(req, res, data);
    originalJson.call(this, data);
  };

  next();
};

// Comprehensive API logging function
const logApiCall = (req, res, responseBody) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user?.userId,
    userRole: req.user?.role,
    statusCode: res.statusCode,
    responseTime: (() => {
      if (!req._startTime) return '-';
      try {
        const hrtime = process.hrtime(req._startTime);
        const responseTime = hrtime[0] * 1000 + hrtime[1] / 1000000;
        return responseTime.toFixed(3) + 'ms';
      } catch (e) {
        return '-';
      }
    })(),
    requestHeaders: maskSensitiveHeaders(req.headers),
    requestBody: maskSensitiveData(req.body),
    responseSize: res.get('content-length') || 0,
    error: res.statusCode >= 400 ? extractError(responseBody) : null
  };

  // Log level based on status code
  if (res.statusCode >= 500) {
    logger.error('API Error', logEntry);
  } else if (res.statusCode >= 400) {
    logger.warn('API Client Error', logEntry);
  } else {
    logger.info('API Request', logEntry);
  }

  // Log to metrics for monitoring
  updateMetrics(req, res);
};

// Mask sensitive headers
const maskSensitiveHeaders = (headers) => {
  const masked = { ...headers };
  const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie'];

  sensitiveHeaders.forEach(header => {
    if (masked[header]) {
      masked[header] = masked[header].substring(0, 10) + '***';
    }
  });

  return masked;
};

// Mask sensitive data in request/response
const maskSensitiveData = (data) => {
  if (!data) return null;

  const cloned = JSON.parse(JSON.stringify(data));
  const sensitiveFields = [
    'password', 'otp', 'token', 'cardNumber',
    'cvv', 'pin', 'aadharNumber', 'panNumber'
  ];

  const maskRecursive = (obj) => {
    Object.keys(obj).forEach(key => {
      if (sensitiveFields.includes(key.toLowerCase())) {
        obj[key] = '***MASKED***';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        maskRecursive(obj[key]);
      }
    });
  };

  maskRecursive(cloned);
  return cloned;
};

// Extract error message from response
const extractError = (responseBody) => {
  if (!responseBody) return null;

  try {
    const parsed = typeof responseBody === 'string'
      ? JSON.parse(responseBody)
      : responseBody;
    return parsed.error || parsed.message || 'Unknown error';
  } catch (e) {
    return responseBody?.toString().substring(0, 200);
  }
};

// Update metrics for monitoring
const updateMetrics = (req, res) => {
  // This would integrate with Prometheus or similar
  // For now, we'll log to a metrics file
  const metricsEntry = {
    timestamp: new Date().toISOString(),
    endpoint: `${req.method} ${req.route?.path || req.path}`,
    statusCode: res.statusCode,
    responseTime: (() => {
      if (!req._startTime) return 0;
      try {
        const hrtime = process.hrtime(req._startTime);
        const responseTime = hrtime[0] * 1000 + hrtime[1] / 1000000;
        return parseFloat(responseTime.toFixed(3));
      } catch (e) {
        return 0;
      }
    })(),
    userId: req.user?.userId || 'anonymous'
  };

  // Write to metrics file for later processing
  fs.appendFile(
    path.join(logsDir, 'metrics.log'),
    JSON.stringify(metricsEntry) + '\n',
    (err) => {
      if (err) logger.error('Failed to write metrics', err);
    }
  );
};

// Morgan format for access logs
const morganFormat = ':request-id :remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms :body';

// Combined Morgan middleware with Winston stream
const morganMiddleware = morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim())
  },
  skip: (req) => req.url === '/health' // Skip health checks
});

// Audit logging for sensitive operations
const auditLog = (action, details, req) => {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    action,
    requestId: req.requestId,
    userId: req.user?.userId,
    userRole: req.user?.role,
    ip: req.ip || req.connection.remoteAddress,
    details: maskSensitiveData(details)
  };

  logger.info('AUDIT', auditEntry);

  // Also write to dedicated audit log
  fs.appendFile(
    path.join(logsDir, 'audit.log'),
    JSON.stringify(auditEntry) + '\n',
    (err) => {
      if (err) logger.error('Failed to write audit log', err);
    }
  );
};

// Performance monitoring middleware
const performanceMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to ms

    // Log slow requests (>1000ms)
    if (duration > 1000) {
      logger.warn('Slow API Request', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        duration: `${duration.toFixed(2)}ms`,
        userId: req.user?.userId
      });
    }

    // Set response header for client monitoring (only if headers haven't been sent)
    if (!res.headersSent) {
      res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
    }
  });

  next();
};

// Error logging middleware
const errorLoggingMiddleware = (err, req, res, next) => {
  logger.error('Unhandled Error', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    userId: req.user?.userId,
    body: maskSensitiveData(req.body)
  });

  next(err);
};

// Log rotation setup
const setupLogRotation = () => {
  // This would be handled by winston-daily-rotate-file in production
  // For now, we'll clean old logs periodically
  setInterval(() => {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    const now = Date.now();

    fs.readdir(logsDir, (err, files) => {
      if (err) return;

      files.forEach(file => {
        const filePath = path.join(logsDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;

          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlink(filePath, (err) => {
              if (err) logger.error('Failed to delete old log', err);
            });
          }
        });
      });
    });
  }, 24 * 60 * 60 * 1000); // Run daily
};

// Initialize log rotation
setupLogRotation();

module.exports = {
  requestIdMiddleware,
  responseInterceptor,
  morganMiddleware,
  performanceMiddleware,
  errorLoggingMiddleware,
  auditLog,
  logger
};