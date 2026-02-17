/**
 * Booking Controller
 * Handles all booking-related operations
 * Implements frozen requirements: ₹5/tonne/km pricing, status-based tracking
 */

const BookingModel = require('../models/bookingModel');
const FleetModel = require('../models/fleetModel');
const { validateBookingWindow } = require('../utils/auth');
const winston = require('winston');

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

class BookingController {
  /**
   * Get bookings for dashboard display
   * GET /api/v1/bookings/dashboard
   * Read-only view that bypasses strict activation check
   */
  static async getDashboardBookings(req, res) {
    try {
      let bookings = [];

      // Get user ID from token
      const userId = req.user.userId;

      if (req.user.role === 'shipper') {
        // Get shipper's bookings directly using user_id
        bookings = await BookingModel.getShipperBookingsByUserId(userId);
      } else if (req.user.role === 'carrier') {
        // Get carrier's bookings through their trucks
        bookings = await BookingModel.getCarrierBookings(req.user.carrierId);
      } else if (req.user.role === 'driver') {
        // Get driver's assigned bookings
        bookings = await BookingModel.getDriverBookings(req.user.driverId);
      } else if (req.user.role === 'admin') {
        // Admin sees all bookings
        bookings = await BookingModel.getAllBookings();
      }

      // Format bookings for dashboard display
      const formattedBookings = bookings.map(booking => ({
        bookingId: booking.booking_id,
        bookingNumber: booking.booking_number,
        status: booking.status,
        pickupLocation: booking.pickup_location,
        deliveryLocation: booking.delivery_location,
        cargoType: booking.cargo_type,
        cargoWeight: booking.cargo_weight,
        totalPrice: booking.total_price,
        pickupDate: booking.pickup_date,
        createdAt: booking.created_at,
        // Format driver object if driver data exists
        driver: booking.driver_name ? {
          name: booking.driver_name,
          phone: booking.driver_phone
        } : null,
        // Format vehicle object if vehicle data exists
        vehicle: booking.vehicle_number ? {
          registration: booking.vehicle_number,
          type: booking.truck_type
        } : null
      }));

      res.json({
        success: true,
        bookings: formattedBookings,
        total: formattedBookings.length
      });
    } catch (error) {
      logger.error('Get dashboard bookings error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to fetch bookings',
          code: 'DASHBOARD_FETCH_ERROR'
        }
      });
    }
  }

  /**
   * Create new booking
   * POST /api/v1/bookings
   */
  static async createBooking(req, res) {
    try {
      // Validate user is a shipper
      if (req.user.role !== 'shipper') {
        return res.status(403).json({
          error: {
            message: 'Only shippers can create bookings',
            code: 'UNAUTHORIZED_ROLE'
          }
        });
      }

      // Validate booking window (max 7 days advance, min 1 hour before)
      const { pickupDate } = req.body;
      const validationResult = validateBookingWindow(pickupDate);

      if (!validationResult.valid) {
        return res.status(400).json({
          error: {
            message: validationResult.message,
            code: 'INVALID_BOOKING_WINDOW'
          }
        });
      }

      // Create booking with auto-pricing (₹5/tonne/km)
      // Use userId directly as shipper_id (bookings.shipper_id references users.user_id)
      const booking = await BookingModel.createBooking(
        req.user.userId,
        req.body
      );

      logger.info('Booking created', {
        bookingId: booking.booking_id,
        bookingNumber: booking.booking_number,
        userId: req.user.userId,
        totalPrice: booking.total_price
      });

      // Fetch full booking details with driver/vehicle info if assigned
      let fullBooking = booking;
      if (booking.truck_id) {
        fullBooking = await BookingModel.getBookingById(booking.booking_id);
      }

      // Build response with driver/vehicle details
      const response = {
        success: true,
        message: 'Booking created successfully',
        booking: {
          bookingId: booking.booking_id,
          bookingNumber: booking.booking_number,
          status: booking.status,
          pickupLocation: booking.pickup_location,
          deliveryLocation: booking.delivery_location,
          pickupDate: booking.pickup_date,
          cargoWeight: booking.cargo_weight_tonnes,
          distance: booking.distance_km,
          basePrice: booking.base_price,
          gstAmount: booking.gst_amount,
          totalPrice: booking.total_price,
          truckAssigned: booking.truck_id ? true : false
        }
      };

      // Add driver and vehicle details if assigned
      if (fullBooking.truck_id) {
        response.booking.driver = {
          name: fullBooking.driver_name || 'Driver Assigned',
          phone: fullBooking.driver_phone || null
        };
        response.booking.vehicle = {
          registration: fullBooking.vehicle_number || null,
          type: fullBooking.truck_type || null
        };
      }

      res.status(201).json(response);
    } catch (error) {
      logger.error('Create booking error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to create booking',
          code: 'BOOKING_CREATE_ERROR'
        }
      });
    }
  }

  /**
   * Get booking by ID
   * GET /api/v1/bookings/:bookingId
   */
  static async getBookingById(req, res) {
    try {
      const { bookingId } = req.params;
      const booking = await BookingModel.getBookingById(bookingId);

      if (!booking) {
        return res.status(404).json({
          error: {
            message: 'Booking not found',
            code: 'BOOKING_NOT_FOUND'
          }
        });
      }

      // Check authorization
      if (req.user.role === 'shipper' && booking.shipper_id !== req.user.userId) {
        return res.status(403).json({
          error: {
            message: 'Unauthorized to view this booking',
            code: 'UNAUTHORIZED_ACCESS'
          }
        });
      }

      // Format the booking response to match frontend expectations
      const formattedBooking = {
        ...booking,
        // Format driver object if driver data exists
        driver: booking.driver_name ? {
          name: booking.driver_name,
          phone: booking.driver_phone
        } : null,
        // Format vehicle object if vehicle data exists
        vehicle: booking.vehicle_number ? {
          registration: booking.vehicle_number,
          type: booking.truck_type
        } : null
      };

      // Remove the flat fields to avoid confusion
      delete formattedBooking.driver_name;
      delete formattedBooking.driver_phone;
      delete formattedBooking.vehicle_number;
      delete formattedBooking.truck_type;

      res.json({
        success: true,
        booking: formattedBooking
      });
    } catch (error) {
      logger.error('Get booking error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to retrieve booking',
          code: 'BOOKING_FETCH_ERROR'
        }
      });
    }
  }

  /**
   * Get user's bookings
   * GET /api/v1/bookings
   */
  static async getUserBookings(req, res) {
    try {
      let bookings = [];
      const filters = {
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 50
      };

      // Get bookings based on user role
      if (req.user.role === 'shipper') {
        bookings = await BookingModel.getShipperBookings(req.user.userId, filters);
      } else if (req.user.role === 'carrier') {
        bookings = await BookingModel.getCarrierBookings(req.user.carrierId, filters);
      } else if (req.user.role === 'driver') {
        bookings = await BookingModel.getDriverBookings(req.user.driverId);
      } else if (req.user.role === 'admin') {
        // Admin can see all bookings
        bookings = await BookingModel.getAllBookings(filters);
      }

      // Format each booking to match frontend expectations
      const formattedBookings = bookings.map(booking => ({
        ...booking,
        // Format driver object if driver data exists
        driver: booking.driver_name ? {
          name: booking.driver_name,
          phone: booking.driver_phone
        } : null,
        // Format vehicle object if vehicle data exists
        vehicle: booking.vehicle_number ? {
          registration: booking.vehicle_number,
          type: booking.truck_type
        } : null
      }));

      // Remove flat fields from each booking
      formattedBookings.forEach(booking => {
        delete booking.driver_name;
        delete booking.driver_phone;
        delete booking.vehicle_number;
        delete booking.truck_type;
      });

      res.json({
        success: true,
        count: formattedBookings.length,
        bookings: formattedBookings
      });
    } catch (error) {
      logger.error('Get bookings error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to retrieve bookings',
          code: 'BOOKINGS_FETCH_ERROR'
        }
      });
    }
  }

  /**
   * Update booking status
   * PUT /api/v1/bookings/:bookingId/status
   */
  static async updateBookingStatus(req, res) {
    try {
      const { bookingId } = req.params;
      const { status, notes } = req.body;

      // Validate status transition
      const validStatuses = ['created', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: {
            message: 'Invalid status',
            code: 'INVALID_STATUS'
          }
        });
      }

      // Get booking to check authorization
      const booking = await BookingModel.getBookingById(bookingId);

      if (!booking) {
        return res.status(404).json({
          error: {
            message: 'Booking not found',
            code: 'BOOKING_NOT_FOUND'
          }
        });
      }

      // Check authorization based on role
      if (req.user.role === 'driver') {
        if (booking.driver_id !== req.user.driverId) {
          return res.status(403).json({
            error: {
              message: 'Unauthorized to update this booking',
              code: 'UNAUTHORIZED_ACCESS'
            }
          });
        }
        // Drivers can only update certain statuses
        if (!['picked_up', 'in_transit', 'delivered'].includes(status)) {
          return res.status(403).json({
            error: {
              message: 'Drivers can only update pickup and delivery status',
              code: 'UNAUTHORIZED_STATUS_UPDATE'
            }
          });
        }
      }

      // Update status
      const updatedBooking = await BookingModel.updateBookingStatus(
        bookingId,
        status,
        req.user.userId,
        notes
      );

      logger.info('Booking status updated', {
        bookingId,
        oldStatus: booking.status,
        newStatus: status,
        userId: req.user.userId
      });

      res.json({
        success: true,
        message: 'Booking status updated',
        booking: updatedBooking
      });
    } catch (error) {
      logger.error('Update booking status error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to update booking status',
          code: 'STATUS_UPDATE_ERROR'
        }
      });
    }
  }

  /**
   * Cancel booking
   * POST /api/v1/bookings/:bookingId/cancel
   */
  static async cancelBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({
          error: {
            message: 'Cancellation reason is required (min 10 characters)',
            code: 'INVALID_REASON'
          }
        });
      }

      // Get booking
      const booking = await BookingModel.getBookingById(bookingId);

      if (!booking) {
        return res.status(404).json({
          error: {
            message: 'Booking not found',
            code: 'BOOKING_NOT_FOUND'
          }
        });
      }

      // Check if booking can be cancelled (2 hours before pickup)
      const pickupTime = new Date(booking.pickup_date);
      const now = new Date();
      const hoursUntilPickup = (pickupTime - now) / (1000 * 60 * 60);

      if (hoursUntilPickup < 2) {
        return res.status(400).json({
          error: {
            message: 'Booking cannot be cancelled within 2 hours of pickup',
            code: 'CANCELLATION_TOO_LATE'
          }
        });
      }

      // Check authorization
      if (req.user.role === 'shipper' && booking.shipper_id !== req.user.userId) {
        return res.status(403).json({
          error: {
            message: 'Unauthorized to cancel this booking',
            code: 'UNAUTHORIZED_ACCESS'
          }
        });
      }

      // Cancel booking
      const cancelledBooking = await BookingModel.cancelBooking(
        bookingId,
        req.user.userId,
        reason
      );

      logger.info('Booking cancelled', {
        bookingId,
        userId: req.user.userId,
        reason
      });

      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        booking: cancelledBooking
      });
    } catch (error) {
      logger.error('Cancel booking error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to cancel booking',
          code: 'CANCELLATION_ERROR'
        }
      });
    }
  }

  /**
   * Upload Proof of Delivery (POD)
   * POST /api/v1/bookings/:bookingId/pod
   */
  static async uploadPOD(req, res) {
    try {
      const { bookingId } = req.params;
      const { podDocument } = req.body;

      if (!podDocument) {
        return res.status(400).json({
          error: {
            message: 'POD document is required',
            code: 'POD_REQUIRED'
          }
        });
      }

      // Get booking
      const booking = await BookingModel.getBookingById(bookingId);

      if (!booking) {
        return res.status(404).json({
          error: {
            message: 'Booking not found',
            code: 'BOOKING_NOT_FOUND'
          }
        });
      }

      // Check if booking is delivered
      if (booking.status !== 'delivered') {
        return res.status(400).json({
          error: {
            message: 'POD can only be uploaded for delivered bookings',
            code: 'INVALID_BOOKING_STATUS'
          }
        });
      }

      // Check authorization (driver or admin)
      if (req.user.role === 'driver' && booking.driver_id !== req.user.driverId) {
        return res.status(403).json({
          error: {
            message: 'Unauthorized to upload POD for this booking',
            code: 'UNAUTHORIZED_ACCESS'
          }
        });
      }

      // Upload POD (max 2MB as per frozen requirements)
      const updatedBooking = await BookingModel.uploadPOD(bookingId, podDocument);

      logger.info('POD uploaded', {
        bookingId,
        userId: req.user.userId
      });

      res.json({
        success: true,
        message: 'POD uploaded successfully',
        booking: updatedBooking
      });
    } catch (error) {
      logger.error('Upload POD error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to upload POD',
          code: 'POD_UPLOAD_ERROR'
        }
      });
    }
  }

  /**
   * Get booking statistics
   * GET /api/v1/bookings/stats
   */
  static async getBookingStats(req, res) {
    try {
      // Admin only endpoint
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          error: {
            message: 'Admin access required',
            code: 'ADMIN_ONLY'
          }
        });
      }

      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const stats = await BookingModel.getBookingStats(filters);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      logger.error('Get booking stats error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to retrieve booking statistics',
          code: 'STATS_FETCH_ERROR'
        }
      });
    }
  }

  /**
   * Assign truck to booking
   * POST /api/v1/bookings/:bookingId/assign-truck
   */
  static async assignTruck(req, res) {
    try {
      const { bookingId } = req.params;
      const { truckId, driverId } = req.body;

      // Admin or carrier only
      if (!['admin', 'carrier'].includes(req.user.role)) {
        return res.status(403).json({
          error: {
            message: 'Only admins and carriers can assign trucks',
            code: 'UNAUTHORIZED_ROLE'
          }
        });
      }

      // Verify truck exists and is available
      const truck = await FleetModel.getTruckById(truckId);

      if (!truck) {
        return res.status(404).json({
          error: {
            message: 'Truck not found',
            code: 'TRUCK_NOT_FOUND'
          }
        });
      }

      if (truck.status !== 'available') {
        return res.status(400).json({
          error: {
            message: 'Truck is not available',
            code: 'TRUCK_UNAVAILABLE'
          }
        });
      }

      // Assign truck
      const updatedBooking = await BookingModel.assignTruck(bookingId, truckId, driverId);

      logger.info('Truck assigned to booking', {
        bookingId,
        truckId,
        driverId,
        userId: req.user.userId
      });

      res.json({
        success: true,
        message: 'Truck assigned successfully',
        booking: updatedBooking
      });
    } catch (error) {
      logger.error('Assign truck error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to assign truck',
          code: 'TRUCK_ASSIGNMENT_ERROR'
        }
      });
    }
  }
}

module.exports = BookingController;