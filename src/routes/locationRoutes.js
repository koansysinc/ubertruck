/**
 * Location Routes
 * PHASE 3: Live tracking endpoints
 */

const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticate } = require('../middleware/authMiddleware');

// Update driver location (protected)
router.post('/update', authenticate, locationController.updateLocation);

// Get driver location
router.get('/driver/:driverId', locationController.getDriverLocation);

// Get all active drivers
router.get('/drivers/active', locationController.getActiveDrivers);

// Simulation endpoints
router.post('/simulate/start', locationController.startSimulation);
router.post('/simulate/stop', locationController.stopSimulation);
router.get('/simulate/active', locationController.getActiveSimulations);

// Calculate distance
router.post('/distance', locationController.calculateDistance);

// Get route for booking
router.get('/route/:bookingId', locationController.getRoute);

module.exports = router;