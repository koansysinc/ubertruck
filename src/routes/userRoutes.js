/**
 * User Routes
 * Authentication and profile management endpoints
 */

const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const {
  authenticate,
  authorize,
  verifyOTP,
  checkRateLimit
} = require('../middleware/authMiddleware');
const { userValidation } = require('../middleware/validation');

/**
 * Public routes (no authentication required)
 */

// Register new user
router.post(
  '/register',
  checkRateLimit('register', 10, 3600), // 10 requests per hour
  userValidation.register,
  UserController.register
);

// Login (request OTP)
router.post(
  '/login',
  checkRateLimit('login', 20, 3600), // 20 requests per hour
  userValidation.login,
  UserController.login
);

// Verify OTP
router.post(
  '/verify-otp',
  checkRateLimit('verify-otp', 10, 300), // 10 attempts per 5 minutes
  userValidation.verifyOTP,
  verifyOTP,
  UserController.verifyOTP
);

// Resend OTP
router.post(
  '/resend-otp',
  checkRateLimit('resend-otp', 5, 300), // 5 requests per 5 minutes
  userValidation.login,
  UserController.resendOTP
);

/**
 * Protected routes (authentication required)
 */

// Get user profile
router.get(
  '/profile',
  authenticate,
  UserController.getProfile
);

// Logout
router.post(
  '/logout',
  authenticate,
  UserController.logout
);

/**
 * Shipper-specific routes
 */

// Create shipper profile
router.post(
  '/profile/shipper',
  authenticate,
  authorize('shipper'),
  userValidation.shipperProfile,
  UserController.createShipperProfile
);

// Update shipper profile
router.put(
  '/profile/shipper',
  authenticate,
  authorize('shipper'),
  userValidation.shipperProfile,
  UserController.updateShipperProfile
);

/**
 * Carrier-specific routes
 */

// Create carrier profile
router.post(
  '/profile/carrier',
  authenticate,
  authorize('carrier'),
  userValidation.carrierProfile,
  UserController.createCarrierProfile
);

// Update carrier profile
router.put(
  '/profile/carrier',
  authenticate,
  authorize('carrier'),
  userValidation.carrierProfile,
  UserController.updateCarrierProfile
);

/**
 * Driver-specific routes
 */

// Create driver profile
router.post(
  '/profile/driver',
  authenticate,
  authorize('driver'),
  userValidation.driverProfile,
  UserController.createDriverProfile
);

// Update driver profile
router.put(
  '/profile/driver',
  authenticate,
  authorize('driver'),
  userValidation.driverProfile,
  UserController.updateDriverProfile
);

/**
 * Admin routes
 */

// Get all users (admin only)
router.get(
  '/all',
  authenticate,
  authorize('admin'),
  UserController.getAllUsers
);

// Update user status (admin only)
router.put(
  '/:userId/status',
  authenticate,
  authorize('admin'),
  UserController.updateUserStatus
);

// API Documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    endpoints: {
      'POST /register': 'Register new user',
      'POST /login': 'Login and request OTP',
      'POST /verify-otp': 'Verify OTP and get JWT token',
      'POST /resend-otp': 'Resend OTP',
      'GET /profile': 'Get user profile (auth required)',
      'POST /logout': 'Logout user',
      'POST /profile/shipper': 'Create shipper profile',
      'PUT /profile/shipper': 'Update shipper profile',
      'POST /profile/carrier': 'Create carrier profile',
      'PUT /profile/carrier': 'Update carrier profile',
      'POST /profile/driver': 'Create driver profile',
      'PUT /profile/driver': 'Update driver profile'
    },
    authentication: 'Bearer token in Authorization header',
    roles: ['shipper', 'carrier', 'driver', 'admin']
  });
});

module.exports = router;