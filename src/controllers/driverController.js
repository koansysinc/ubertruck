/**
 * Driver Controller
 * Handles all driver-specific operations following Uber-style patterns
 */

const { v4: uuidv4 } = require('uuid');
const DriverModel = require('../models/driverModel');
const BookingModel = require('../models/bookingModel');
const { generateToken } = require('../utils/auth');

class DriverController {
  /**
   * Driver Registration/Onboarding
   * POST /api/v1/drivers/register
   */
  static async register(req, res) {
    try {
      const {
        phoneNumber,
        fullName,
        licenseNumber,
        vehicleNumber,
        vehicleType,
        aadharNumber,
        panNumber,
        bankDetails
      } = req.body;

      // Check if driver already exists
      const existingDriver = await DriverModel.findByPhone(phoneNumber);
      if (existingDriver) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Driver already registered',
            code: 'DRIVER_EXISTS'
          }
        });
      }

      // Create driver profile
      const driverId = `driver-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const driver = await DriverModel.create({
        driver_id: driverId,
        phone_number: phoneNumber,
        full_name: fullName,
        license_number: licenseNumber,
        vehicle_number: vehicleNumber,
        vehicle_type: vehicleType,
        aadhar_number: aadharNumber,
        pan_number: panNumber,
        bank_account_number: bankDetails?.accountNumber,
        bank_ifsc: bankDetails?.ifscCode,
        bank_account_name: bankDetails?.accountName,
        status: 'pending_verification', // Pending KYC verification
        is_available: false,
        total_trips: 0,
        total_earnings: 0,
        rating: 0,
        created_at: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Driver registration successful. Verification pending.',
        data: {
          driverId: driver.driver_id,
          status: driver.status,
          verificationSteps: {
            documentsUploaded: true,
            kycPending: true,
            vehicleInspection: 'pending',
            backgroundCheck: 'pending'
          }
        }
      });
    } catch (error) {
      console.error('Driver registration error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Registration failed',
          code: 'REGISTRATION_ERROR'
        }
      });
    }
  }

  /**
   * Get Driver Profile
   * GET /api/v1/drivers/profile
   */
  static async getProfile(req, res) {
    try {
      const driverId = req.user.driverId;
      const driver = await DriverModel.findById(driverId);

      if (!driver) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Driver not found',
            code: 'DRIVER_NOT_FOUND'
          }
        });
      }

      // Get today's earnings
      const todayEarnings = await DriverModel.getTodayEarnings(driverId);

      // Get current week earnings
      const weekEarnings = await DriverModel.getWeekEarnings(driverId);

      res.json({
        success: true,
        data: {
          profile: {
            driverId: driver.driver_id,
            name: driver.full_name,
            phone: driver.phone_number,
            vehicleNumber: driver.vehicle_number,
            vehicleType: driver.vehicle_type,
            rating: driver.rating || 4.5,
            totalTrips: driver.total_trips,
            joinedDate: driver.created_at
          },
          earnings: {
            today: todayEarnings || 0,
            week: weekEarnings || 0,
            total: driver.total_earnings || 0,
            currency: 'INR'
          },
          status: {
            isOnline: driver.is_online || false,
            isAvailable: driver.is_available || false,
            currentBooking: driver.current_booking_id || null
          }
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch profile',
          code: 'PROFILE_ERROR'
        }
      });
    }
  }

  /**
   * Toggle Driver Availability (Go Online/Offline)
   * POST /api/v1/drivers/toggle-availability
   */
  static async toggleAvailability(req, res) {
    try {
      const driverId = req.user.driver_id;
      const { isOnline, latitude, longitude } = req.body;

      const driver = await DriverModel.updateAvailability(driverId, {
        is_online: isOnline,
        is_available: isOnline, // Available when online and not on trip
        last_location_lat: latitude,
        last_location_lng: longitude,
        last_location_update: new Date()
      });

      res.json({
        success: true,
        message: isOnline ? 'You are now online' : 'You are now offline',
        data: {
          isOnline,
          isAvailable: driver.is_available
        }
      });
    } catch (error) {
      console.error('Toggle availability error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update availability',
          code: 'AVAILABILITY_ERROR'
        }
      });
    }
  }

  /**
   * Get Available Trips (Trip Requests)
   * GET /api/v1/drivers/available-trips
   */
  static async getAvailableTrips(req, res) {
    try {
      const driverId = req.user.driver_id;
      const driver = await DriverModel.findById(driverId);

      if (!driver.is_available) {
        return res.json({
          success: true,
          data: {
            trips: [],
            message: 'Go online to see available trips'
          }
        });
      }

      // Get nearby unassigned bookings
      const availableTrips = await BookingModel.getNearbyUnassignedBookings({
        latitude: driver.last_location_lat,
        longitude: driver.last_location_lng,
        vehicleType: driver.vehicle_type,
        radius: 10 // 10 km radius
      });

      const formattedTrips = availableTrips.map(trip => ({
        bookingId: trip.booking_id,
        pickup: {
          address: trip.pickup_address,
          pincode: trip.pickup_pincode,
          latitude: trip.pickup_lat,
          longitude: trip.pickup_lng
        },
        delivery: {
          address: trip.delivery_address,
          pincode: trip.delivery_pincode,
          latitude: trip.delivery_lat,
          longitude: trip.delivery_lng
        },
        distance: trip.distance_km,
        estimatedEarnings: trip.driver_payment || trip.total_amount * 0.8, // 80% goes to driver
        cargo: {
          type: trip.cargo_type,
          weight: trip.weight_tonnes,
          description: trip.cargo_description
        },
        requestedAt: trip.created_at
      }));

      res.json({
        success: true,
        data: {
          trips: formattedTrips,
          totalAvailable: formattedTrips.length
        }
      });
    } catch (error) {
      console.error('Get available trips error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch available trips',
          code: 'TRIPS_ERROR'
        }
      });
    }
  }

  /**
   * Accept Trip Request
   * POST /api/v1/drivers/accept-trip
   */
  static async acceptTrip(req, res) {
    try {
      const driverId = req.user.driver_id;
      const { bookingId } = req.body;

      // Check if driver is available
      const driver = await DriverModel.findById(driverId);
      if (!driver.is_available) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'You must be available to accept trips',
            code: 'DRIVER_NOT_AVAILABLE'
          }
        });
      }

      // Check if booking is still available
      const booking = await BookingModel.findById(bookingId);
      if (!booking || booking.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Trip no longer available',
            code: 'TRIP_NOT_AVAILABLE'
          }
        });
      }

      // Assign driver to booking
      await BookingModel.assignDriver(bookingId, {
        driver_id: driverId,
        driver_name: driver.full_name,
        driver_phone: driver.phone_number,
        vehicle_number: driver.vehicle_number,
        vehicle_type: driver.vehicle_type,
        status: 'assigned',
        assigned_at: new Date()
      });

      // Update driver status
      await DriverModel.updateAvailability(driverId, {
        is_available: false,
        current_booking_id: bookingId
      });

      res.json({
        success: true,
        message: 'Trip accepted successfully',
        data: {
          bookingId,
          tripDetails: {
            pickup: booking.pickup_address,
            delivery: booking.delivery_address,
            distance: booking.distance_km,
            estimatedEarnings: booking.total_amount * 0.8,
            customerPhone: booking.customer_phone
          },
          nextAction: 'Navigate to pickup location'
        }
      });
    } catch (error) {
      console.error('Accept trip error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to accept trip',
          code: 'ACCEPT_ERROR'
        }
      });
    }
  }

  /**
   * Reject Trip Request
   * POST /api/v1/drivers/reject-trip
   */
  static async rejectTrip(req, res) {
    try {
      const driverId = req.user.driver_id;
      const { bookingId, reason } = req.body;

      // Log rejection for analytics
      await DriverModel.logTripRejection({
        driver_id: driverId,
        booking_id: bookingId,
        reason,
        rejected_at: new Date()
      });

      res.json({
        success: true,
        message: 'Trip rejected',
        data: {
          bookingId,
          reason
        }
      });
    } catch (error) {
      console.error('Reject trip error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to reject trip',
          code: 'REJECT_ERROR'
        }
      });
    }
  }

  /**
   * Update Trip Status (Start Trip, Complete Trip)
   * POST /api/v1/drivers/update-trip-status
   */
  static async updateTripStatus(req, res) {
    try {
      const driverId = req.user.driver_id;
      const { bookingId, status, latitude, longitude, odometerReading } = req.body;

      const booking = await BookingModel.findById(bookingId);
      if (!booking || booking.driver_id !== driverId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Unauthorized to update this trip',
            code: 'UNAUTHORIZED'
          }
        });
      }

      const updates = {
        status,
        [`${status}_at`]: new Date(),
        [`${status}_location_lat`]: latitude,
        [`${status}_location_lng`]: longitude
      };

      if (status === 'picked_up') {
        updates.pickup_odometer = odometerReading;
      } else if (status === 'delivered') {
        updates.delivery_odometer = odometerReading;
        updates.actual_distance_km = odometerReading - booking.pickup_odometer;

        // Update driver earnings
        const earnings = booking.total_amount * 0.8;
        await DriverModel.updateEarnings(driverId, earnings);

        // Mark driver as available again
        await DriverModel.updateAvailability(driverId, {
          is_available: true,
          current_booking_id: null,
          total_trips: booking.driver_total_trips + 1
        });
      }

      await BookingModel.updateStatus(bookingId, updates);

      res.json({
        success: true,
        message: `Trip ${status} successfully`,
        data: {
          bookingId,
          status,
          nextAction: status === 'picked_up' ? 'Navigate to delivery location' :
                     status === 'delivered' ? 'Trip completed' : 'Continue trip'
        }
      });
    } catch (error) {
      console.error('Update trip status error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update trip status',
          code: 'UPDATE_ERROR'
        }
      });
    }
  }

  /**
   * Get Earnings Summary
   * GET /api/v1/drivers/earnings
   */
  static async getEarnings(req, res) {
    try {
      const driverId = req.user.driver_id;
      const { period = 'week' } = req.query;

      const earnings = await DriverModel.getEarningsDetails(driverId, period);

      res.json({
        success: true,
        data: {
          summary: {
            total: earnings.total,
            trips: earnings.tripCount,
            averagePerTrip: earnings.average,
            period
          },
          breakdown: earnings.breakdown,
          payments: {
            pending: earnings.pendingAmount,
            processed: earnings.processedAmount,
            nextPayout: earnings.nextPayoutDate
          }
        }
      });
    } catch (error) {
      console.error('Get earnings error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch earnings',
          code: 'EARNINGS_ERROR'
        }
      });
    }
  }

  /**
   * Get Trip History
   * GET /api/v1/drivers/trip-history
   */
  static async getTripHistory(req, res) {
    try {
      const driverId = req.user.driver_id;
      const { page = 1, limit = 20 } = req.query;

      const trips = await BookingModel.getDriverTripHistory(driverId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: {
          trips: trips.data,
          pagination: {
            current: trips.page,
            total: trips.totalPages,
            count: trips.total
          }
        }
      });
    } catch (error) {
      console.error('Get trip history error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch trip history',
          code: 'HISTORY_ERROR'
        }
      });
    }
  }
}

module.exports = DriverController;