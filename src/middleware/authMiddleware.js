/**
 * Authentication Middleware
 * JWT verification and role-based access control
 */

const { verifyToken, normalizePhoneNumber } = require('../utils/auth');
const UserModel = require('../models/userModel');
const { cache } = require('../config/redis');

/**
 * Verify JWT token middleware
 */
async function authenticate(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'No token provided',
          code: 'NO_TOKEN'
        }
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        error: {
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        }
      });
    }

    // Check if user exists and is active
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    if (!user.is_active && user.role !== 'admin') {
      return res.status(403).json({
        error: {
          message: 'Account not active',
          code: 'ACCOUNT_INACTIVE'
        }
      });
    }

    // Attach user to request
    req.user = {
      userId: user.user_id,
      phoneNumber: user.phone_number,
      role: user.role,
      isActive: user.is_active,
      isVerified: user.is_verified,
      shipperId: user.shipper_id,
      carrierId: user.carrier_id,
      driverId: user.driver_id
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: {
        message: 'Authentication failed',
        code: 'AUTH_ERROR'
      }
    });
  }
}

/**
 * Role-based access control middleware
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: 'Insufficient permissions',
          code: 'FORBIDDEN',
          requiredRole: allowedRoles,
          userRole: req.user.role
        }
      });
    }

    next();
  };
}

/**
 * OTP verification middleware
 */
async function verifyOTP(req, res, next) {
  try {
    let { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        error: {
          message: 'Phone number and OTP are required',
          code: 'MISSING_FIELDS'
        }
      });
    }

    // Normalize phone number (strip +91 if present)
    phoneNumber = normalizePhoneNumber(phoneNumber);

    // Get OTP from cache
    const storedOTP = await cache.getOTP(phoneNumber);

    if (!storedOTP) {
      return res.status(400).json({
        error: {
          message: 'OTP expired or not found',
          code: 'OTP_EXPIRED'
        }
      });
    }

    // Convert both to strings for comparison
    if (String(storedOTP) !== String(otp)) {
      console.log('OTP mismatch:', { stored: storedOTP, provided: otp });
      return res.status(400).json({
        error: {
          message: 'Invalid OTP',
          code: 'INVALID_OTP'
        }
      });
    }

    // OTP is valid, continue
    req.otpVerified = true;

    // Invalidate OTP after successful verification
    await cache.invalidateOTP(phoneNumber);

    next();
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({
      error: {
        message: 'OTP verification failed',
        code: 'OTP_VERIFICATION_ERROR'
      }
    });
  }
}

/**
 * Rate limiting check (using Redis)
 */
function checkRateLimit(identifier, limit = 100, window = 60) {
  return async (req, res, next) => {
    try {
      const key = `${identifier}:${req.ip || req.connection.remoteAddress}`;
      const allowed = await cache.checkRateLimit(key, limit, window);

      if (!allowed) {
        return res.status(429).json({
          error: {
            message: 'Too many requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED'
          }
        });
      }

      next();
    } catch (error) {
      // If Redis fails, allow request but log error
      console.error('Rate limit check failed:', error);
      next();
    }
  };
}

/**
 * Optional authentication - doesn't fail if no token
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (decoded) {
    const user = await UserModel.findById(decoded.userId);
    if (user && user.status === 'active') {
      req.user = {
        userId: user.user_id,
        phoneNumber: user.phone_number,
        role: user.role,
        status: user.status,
        shipperId: user.shipper_id,
        carrierId: user.carrier_id,
        driverId: user.driver_id
      };
    }
  }

  next();
}

module.exports = {
  authenticate,
  authorize,
  verifyOTP,
  checkRateLimit,
  optionalAuth
};