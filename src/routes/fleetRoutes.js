/**
 * Fleet Routes
 * Truck and driver management endpoints
 */

const express = require('express');
const router = express.Router();
const FleetController = require('../controllers/fleetController');
const {
  authenticate,
  authorize,
  checkRateLimit
} = require('../middleware/authMiddleware');
const { fleetValidation, commonValidation } = require('../middleware/validation');

/**
 * Public routes
 */

// Get available trucks (public for viewing)
router.get(
  '/available',
  FleetController.getAvailableTrucks
);

/**
 * Protected routes - Carrier only
 */

// Add new truck
router.post(
  '/trucks',
  authenticate,
  authorize('carrier'),
  fleetValidation.addTruck,
  FleetController.addTruck
);

// Get carrier's trucks
router.get(
  '/my-trucks',
  authenticate,
  authorize('carrier'),
  FleetController.getMyTrucks
);

// Get truck details
router.get(
  '/trucks/:truckId',
  authenticate,
  authorize('carrier', 'driver', 'admin'),
  commonValidation.uuidParam('truckId'),
  FleetController.getTruckDetails
);

// Update truck status
router.put(
  '/trucks/:truckId/status',
  authenticate,
  authorize('carrier', 'driver'),
  commonValidation.uuidParam('truckId'),
  fleetValidation.updateTruck,
  FleetController.updateTruckStatus
);

// Assign driver to truck
router.post(
  '/trucks/:truckId/assign-driver',
  authenticate,
  authorize('carrier'),
  commonValidation.uuidParam('truckId'),
  fleetValidation.assignDriver,
  FleetController.assignDriver
);

// Update truck location
router.put(
  '/trucks/:truckId/location',
  authenticate,
  authorize('carrier', 'driver'),
  commonValidation.uuidParam('truckId'),
  FleetController.updateLocation
);

// Update truck details
router.put(
  '/trucks/:truckId',
  authenticate,
  authorize('carrier'),
  commonValidation.uuidParam('truckId'),
  FleetController.updateTruck
);

// Delete truck (soft delete)
router.delete(
  '/trucks/:truckId',
  authenticate,
  authorize('carrier'),
  commonValidation.uuidParam('truckId'),
  FleetController.deleteTruck
);

// Check truck availability
router.get(
  '/trucks/:truckId/availability',
  authenticate,
  commonValidation.uuidParam('truckId'),
  FleetController.checkAvailability
);

/**
 * Driver Management Routes
 */

// Get carrier's drivers
router.get(
  '/drivers',
  authenticate,
  authorize('carrier'),
  (req, res) => {
    // Placeholder - to be implemented
    res.status(501).json({
      error: {
        message: 'Driver management not yet implemented',
        code: 'NOT_IMPLEMENTED'
      }
    });
  }
);

// API Documentation
router.get('/docs', (req, res) => {
  res.json({
    endpoints: {
      'GET /available': 'Get all available trucks',
      'POST /trucks': 'Add new truck (carrier only)',
      'GET /my-trucks': 'Get carrier trucks (carrier only)',
      'GET /trucks/:id': 'Get truck details',
      'PUT /trucks/:id/status': 'Update truck status',
      'POST /trucks/:id/assign-driver': 'Assign driver to truck',
      'PUT /trucks/:id/location': 'Update truck location',
      'PUT /trucks/:id': 'Update truck details',
      'DELETE /trucks/:id': 'Remove truck from fleet',
      'GET /trucks/:id/availability': 'Check truck availability'
    },
    truckTypes: ['10T', '15T', '20T'],
    truckStatus: ['available', 'in_transit', 'maintenance', 'inactive']
  });
});

module.exports = router;