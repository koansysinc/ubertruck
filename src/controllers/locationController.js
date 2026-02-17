/**
 * Location Controller
 * Handles location-related API endpoints
 * PHASE 3: Live tracking implementation
 */

const locationService = require('../services/locationService');
const locationSimulator = require('../services/locationSimulator');
const { logger } = require('../middleware/loggingMiddleware');

class LocationController {
  /**
   * Update driver location
   * POST /api/v1/location/update
   */
  async updateLocation(req, res) {
    try {
      const { driverId, lat, lng, heading, speed, accuracy } = req.body;

      // Validate input
      if (!driverId || !lat || !lng) {
        return res.status(400).json({
          error: {
            message: 'Driver ID, latitude, and longitude are required',
            code: 'MISSING_LOCATION_DATA'
          }
        });
      }

      // Update location
      const locationData = locationService.updateDriverLocation(
        driverId,
        lat,
        lng,
        heading,
        speed,
        accuracy
      );

      logger.info({
        action: 'location_update',
        driverId,
        position: { lat, lng },
        speed
      });

      res.status(200).json({
        success: true,
        location: locationData
      });
    } catch (error) {
      logger.error({ error: error.message, stack: error.stack });
      res.status(500).json({
        error: {
          message: 'Failed to update location',
          code: 'LOCATION_UPDATE_ERROR'
        }
      });
    }
  }

  /**
   * Get driver's current location
   * GET /api/v1/location/:driverId
   */
  async getDriverLocation(req, res) {
    try {
      const { driverId } = req.params;

      const location = locationService.getDriverLocation(driverId);

      if (!location) {
        return res.status(404).json({
          error: {
            message: 'Driver location not found',
            code: 'LOCATION_NOT_FOUND'
          }
        });
      }

      res.status(200).json({
        success: true,
        location
      });
    } catch (error) {
      logger.error({ error: error.message, stack: error.stack });
      res.status(500).json({
        error: {
          message: 'Failed to get location',
          code: 'LOCATION_FETCH_ERROR'
        }
      });
    }
  }

  /**
   * Get all active drivers
   * GET /api/v1/location/drivers/active
   */
  async getActiveDrivers(req, res) {
    try {
      const locations = locationService.getAllDriverLocations();

      res.status(200).json({
        success: true,
        count: locations.length,
        drivers: locations
      });
    } catch (error) {
      logger.error({ error: error.message, stack: error.stack });
      res.status(500).json({
        error: {
          message: 'Failed to get active drivers',
          code: 'ACTIVE_DRIVERS_ERROR'
        }
      });
    }
  }

  /**
   * Start location simulation for a booking
   * POST /api/v1/location/simulate/start
   */
  async startSimulation(req, res) {
    try {
      const { bookingId, driverId } = req.body;

      if (!bookingId || !driverId) {
        return res.status(400).json({
          error: {
            message: 'Booking ID and Driver ID are required',
            code: 'MISSING_SIMULATION_DATA'
          }
        });
      }

      const started = locationSimulator.startSimulation(bookingId, driverId);

      if (!started) {
        return res.status(409).json({
          error: {
            message: 'Simulation already active for this booking',
            code: 'SIMULATION_ALREADY_ACTIVE'
          }
        });
      }

      logger.info({
        action: 'simulation_started',
        bookingId,
        driverId
      });

      res.status(200).json({
        success: true,
        message: 'Location simulation started',
        bookingId,
        driverId
      });
    } catch (error) {
      logger.error({ error: error.message, stack: error.stack });
      res.status(500).json({
        error: {
          message: 'Failed to start simulation',
          code: 'SIMULATION_START_ERROR'
        }
      });
    }
  }

  /**
   * Stop location simulation
   * POST /api/v1/location/simulate/stop
   */
  async stopSimulation(req, res) {
    try {
      const { bookingId } = req.body;

      if (!bookingId) {
        return res.status(400).json({
          error: {
            message: 'Booking ID is required',
            code: 'MISSING_BOOKING_ID'
          }
        });
      }

      const stopped = locationSimulator.stopSimulation(bookingId);

      if (!stopped) {
        return res.status(404).json({
          error: {
            message: 'No active simulation for this booking',
            code: 'SIMULATION_NOT_FOUND'
          }
        });
      }

      logger.info({
        action: 'simulation_stopped',
        bookingId
      });

      res.status(200).json({
        success: true,
        message: 'Location simulation stopped',
        bookingId
      });
    } catch (error) {
      logger.error({ error: error.message, stack: error.stack });
      res.status(500).json({
        error: {
          message: 'Failed to stop simulation',
          code: 'SIMULATION_STOP_ERROR'
        }
      });
    }
  }

  /**
   * Get active simulations
   * GET /api/v1/location/simulate/active
   */
  async getActiveSimulations(req, res) {
    try {
      const simulations = locationSimulator.getActiveSimulations();

      res.status(200).json({
        success: true,
        count: simulations.length,
        simulations
      });
    } catch (error) {
      logger.error({ error: error.message, stack: error.stack });
      res.status(500).json({
        error: {
          message: 'Failed to get active simulations',
          code: 'SIMULATIONS_FETCH_ERROR'
        }
      });
    }
  }

  /**
   * Calculate distance between two points
   * POST /api/v1/location/distance
   */
  async calculateDistance(req, res) {
    try {
      const { point1, point2 } = req.body;

      if (!point1 || !point2 || !point1.lat || !point1.lng || !point2.lat || !point2.lng) {
        return res.status(400).json({
          error: {
            message: 'Two points with lat and lng are required',
            code: 'INVALID_POINTS'
          }
        });
      }

      const distance = locationService.calculateDistance(point1, point2);
      const eta = locationService.estimateTravelTime(distance);

      res.status(200).json({
        success: true,
        distance: distance.toFixed(2),
        unit: 'km',
        estimatedTime: eta,
        timeUnit: 'minutes'
      });
    } catch (error) {
      logger.error({ error: error.message, stack: error.stack });
      res.status(500).json({
        error: {
          message: 'Failed to calculate distance',
          code: 'DISTANCE_CALCULATION_ERROR'
        }
      });
    }
  }

  /**
   * Get route information
   * GET /api/v1/location/route/:bookingId
   */
  async getRoute(req, res) {
    try {
      const { bookingId } = req.params;

      // For demo, return the predefined route
      const route = locationService.getRoute(
        { lat: 17.0477, lng: 79.2666 },  // Nalgonda
        { lat: 16.8700, lng: 79.5900 }   // Miryalguda
      );

      res.status(200).json({
        success: true,
        bookingId,
        route
      });
    } catch (error) {
      logger.error({ error: error.message, stack: error.stack });
      res.status(500).json({
        error: {
          message: 'Failed to get route',
          code: 'ROUTE_FETCH_ERROR'
        }
      });
    }
  }
}

module.exports = new LocationController();