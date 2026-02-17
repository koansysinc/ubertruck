/**
 * Driver Routes
 * All driver-specific API endpoints
 */

const express = require('express');
const router = express.Router();
const DriverController = require('../controllers/driverController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateDriverRegistration, validateTripAction } = require('../middleware/validation');

// Public routes (no auth required)
router.post('/register', validateDriverRegistration, DriverController.register);

// Protected routes (driver auth required)
router.use(authenticate);
router.use(authorize('driver'));

// Profile management
router.get('/profile', DriverController.getProfile);
router.post('/toggle-availability', DriverController.toggleAvailability);

// Trip management
router.get('/available-trips', DriverController.getAvailableTrips);
router.post('/accept-trip', validateTripAction, DriverController.acceptTrip);
router.post('/reject-trip', validateTripAction, DriverController.rejectTrip);
router.post('/update-trip-status', DriverController.updateTripStatus);

// Earnings and history
router.get('/earnings', DriverController.getEarnings);
router.get('/trip-history', DriverController.getTripHistory);

module.exports = router;