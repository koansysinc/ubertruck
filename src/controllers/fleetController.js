/**
 * Fleet Controller
 * Handles truck and fleet management operations
 */

const FleetModel = require('../models/fleetModel');
const UserModel = require('../models/userModel');
const { validateVehicleNumber } = require('../utils/auth');

class FleetController {
  /**
   * Add new truck
   */
  static async addTruck(req, res) {
    try {
      // Check if user is a carrier
      if (req.user.role !== 'carrier' || !req.user.carrierId) {
        return res.status(403).json({
          error: {
            message: 'Only carriers can add trucks',
            code: 'UNAUTHORIZED'
          }
        });
      }

      const truck = await FleetModel.addTruck(req.user.carrierId, req.body);

      res.status(201).json({
        success: true,
        message: 'Truck added successfully',
        truck
      });
    } catch (error) {
      console.error('Add truck error:', error);

      // Handle unique constraint violation
      if (error.code === '23505') {
        return res.status(409).json({
          error: {
            message: 'Vehicle number already registered',
            code: 'DUPLICATE_VEHICLE'
          }
        });
      }

      res.status(500).json({
        error: {
          message: 'Failed to add truck',
          code: 'ADD_TRUCK_ERROR'
        }
      });
    }
  }

  /**
   * Get carrier's trucks
   */
  static async getMyTrucks(req, res) {
    try {
      if (req.user.role !== 'carrier' || !req.user.carrierId) {
        return res.status(403).json({
          error: {
            message: 'Only carriers can view their trucks',
            code: 'UNAUTHORIZED'
          }
        });
      }

      const trucks = await FleetModel.getCarrierTrucks(req.user.carrierId);
      const summary = await FleetModel.getFleetSummary(req.user.carrierId);

      res.json({
        success: true,
        summary,
        trucks
      });
    } catch (error) {
      console.error('Get trucks error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to fetch trucks',
          code: 'FETCH_TRUCKS_ERROR'
        }
      });
    }
  }

  /**
   * Get truck details
   */
  static async getTruckDetails(req, res) {
    try {
      const { truckId } = req.params;

      const truck = await FleetModel.getTruckById(truckId);

      if (!truck) {
        return res.status(404).json({
          error: {
            message: 'Truck not found',
            code: 'TRUCK_NOT_FOUND'
          }
        });
      }

      // Check authorization
      if (req.user.role === 'carrier' && truck.carrier_id !== req.user.carrierId) {
        return res.status(403).json({
          error: {
            message: 'Unauthorized to view this truck',
            code: 'UNAUTHORIZED'
          }
        });
      }

      const stats = await FleetModel.getTruckStats(truckId);

      res.json({
        success: true,
        truck,
        statistics: stats
      });
    } catch (error) {
      console.error('Get truck details error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to fetch truck details',
          code: 'FETCH_DETAILS_ERROR'
        }
      });
    }
  }

  /**
   * Update truck status
   */
  static async updateTruckStatus(req, res) {
    try {
      const { truckId } = req.params;
      const { status } = req.body;

      // Get truck to check ownership
      const truck = await FleetModel.getTruckById(truckId);

      if (!truck) {
        return res.status(404).json({
          error: {
            message: 'Truck not found',
            code: 'TRUCK_NOT_FOUND'
          }
        });
      }

      // Check authorization
      if (req.user.role === 'carrier' && truck.carrier_id !== req.user.carrierId) {
        return res.status(403).json({
          error: {
            message: 'Unauthorized to update this truck',
            code: 'UNAUTHORIZED'
          }
        });
      }

      const updatedTruck = await FleetModel.updateTruckStatus(truckId, status);

      res.json({
        success: true,
        message: 'Truck status updated',
        truck: updatedTruck
      });
    } catch (error) {
      console.error('Update truck status error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to update truck status',
          code: 'UPDATE_STATUS_ERROR'
        }
      });
    }
  }

  /**
   * Assign driver to truck
   */
  static async assignDriver(req, res) {
    try {
      const { truckId } = req.params;
      const { driverId } = req.body;

      // Get truck to check ownership
      const truck = await FleetModel.getTruckById(truckId);

      if (!truck) {
        return res.status(404).json({
          error: {
            message: 'Truck not found',
            code: 'TRUCK_NOT_FOUND'
          }
        });
      }

      // Check authorization
      if (req.user.role !== 'carrier' || truck.carrier_id !== req.user.carrierId) {
        return res.status(403).json({
          error: {
            message: 'Unauthorized to assign driver to this truck',
            code: 'UNAUTHORIZED'
          }
        });
      }

      const updatedTruck = await FleetModel.assignDriver(truckId, driverId);

      res.json({
        success: true,
        message: 'Driver assigned successfully',
        truck: updatedTruck
      });
    } catch (error) {
      console.error('Assign driver error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to assign driver',
          code: 'ASSIGN_DRIVER_ERROR'
        }
      });
    }
  }

  /**
   * Get available trucks
   */
  static async getAvailableTrucks(req, res) {
    try {
      const { truckType } = req.query;

      // Validate truck type if provided
      if (truckType && !['10T', '15T', '20T'].includes(truckType)) {
        return res.status(400).json({
          error: {
            message: 'Invalid truck type. Must be 10T, 15T, or 20T',
            code: 'INVALID_TRUCK_TYPE'
          }
        });
      }

      const trucks = await FleetModel.getAvailableTrucks(truckType);

      res.json({
        success: true,
        count: trucks.length,
        trucks
      });
    } catch (error) {
      console.error('Get available trucks error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to fetch available trucks',
          code: 'FETCH_AVAILABLE_ERROR'
        }
      });
    }
  }

  /**
   * Update truck location
   */
  static async updateLocation(req, res) {
    try {
      const { truckId } = req.params;
      const { latitude, longitude } = req.body;

      // Validate coordinates are within corridor
      const isValidLat = latitude >= 16.5 && latitude <= 17.5;
      const isValidLng = longitude >= 79.0 && longitude <= 80.0;

      if (!isValidLat || !isValidLng) {
        return res.status(400).json({
          error: {
            message: 'Location outside service corridor',
            code: 'INVALID_LOCATION'
          }
        });
      }

      // Check authorization
      const truck = await FleetModel.getTruckById(truckId);

      if (!truck) {
        return res.status(404).json({
          error: {
            message: 'Truck not found',
            code: 'TRUCK_NOT_FOUND'
          }
        });
      }

      // Only driver or carrier can update location
      if (req.user.role === 'driver' && truck.driver_id !== req.user.driverId) {
        return res.status(403).json({
          error: {
            message: 'Unauthorized to update this truck location',
            code: 'UNAUTHORIZED'
          }
        });
      }

      if (req.user.role === 'carrier' && truck.carrier_id !== req.user.carrierId) {
        return res.status(403).json({
          error: {
            message: 'Unauthorized to update this truck location',
            code: 'UNAUTHORIZED'
          }
        });
      }

      const updatedTruck = await FleetModel.updateTruckLocation(
        truckId,
        latitude,
        longitude
      );

      res.json({
        success: true,
        message: 'Location updated',
        location: {
          latitude: updatedTruck.current_location_lat,
          longitude: updatedTruck.current_location_lng
        }
      });
    } catch (error) {
      console.error('Update location error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to update location',
          code: 'UPDATE_LOCATION_ERROR'
        }
      });
    }
  }

  /**
   * Update truck details
   */
  static async updateTruck(req, res) {
    try {
      const { truckId } = req.params;

      // Get truck to check ownership
      const truck = await FleetModel.getTruckById(truckId);

      if (!truck) {
        return res.status(404).json({
          error: {
            message: 'Truck not found',
            code: 'TRUCK_NOT_FOUND'
          }
        });
      }

      // Check authorization
      if (req.user.role !== 'carrier' || truck.carrier_id !== req.user.carrierId) {
        return res.status(403).json({
          error: {
            message: 'Unauthorized to update this truck',
            code: 'UNAUTHORIZED'
          }
        });
      }

      const updatedTruck = await FleetModel.updateTruck(truckId, req.body);

      res.json({
        success: true,
        message: 'Truck updated successfully',
        truck: updatedTruck
      });
    } catch (error) {
      console.error('Update truck error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to update truck',
          code: 'UPDATE_TRUCK_ERROR'
        }
      });
    }
  }

  /**
   * Delete truck (soft delete)
   */
  static async deleteTruck(req, res) {
    try {
      const { truckId } = req.params;

      // Get truck to check ownership
      const truck = await FleetModel.getTruckById(truckId);

      if (!truck) {
        return res.status(404).json({
          error: {
            message: 'Truck not found',
            code: 'TRUCK_NOT_FOUND'
          }
        });
      }

      // Check authorization
      if (req.user.role !== 'carrier' || truck.carrier_id !== req.user.carrierId) {
        return res.status(403).json({
          error: {
            message: 'Unauthorized to delete this truck',
            code: 'UNAUTHORIZED'
          }
        });
      }

      await FleetModel.deleteTruck(truckId);

      res.json({
        success: true,
        message: 'Truck removed from fleet'
      });
    } catch (error) {
      console.error('Delete truck error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to delete truck',
          code: 'DELETE_TRUCK_ERROR'
        }
      });
    }
  }

  /**
   * Check truck availability
   */
  static async checkAvailability(req, res) {
    try {
      const { truckId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: {
            message: 'Start date and end date are required',
            code: 'MISSING_DATES'
          }
        });
      }

      const isAvailable = await FleetModel.checkAvailability(
        truckId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        truckId,
        period: {
          startDate,
          endDate
        },
        available: isAvailable
      });
    } catch (error) {
      console.error('Check availability error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to check availability',
          code: 'CHECK_AVAILABILITY_ERROR'
        }
      });
    }
  }
}

module.exports = FleetController;