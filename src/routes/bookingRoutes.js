/**
 * Booking Routes
 * Booking management endpoints with frozen requirements enforcement
 */

const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/bookingController');
const {
  authenticate,
  authorize,
  checkRateLimit
} = require('../middleware/authMiddleware');
const { bookingValidation, commonValidation } = require('../middleware/validation');

/**
 * GET /api/v1/bookings
 * Get user's bookings based on role
 * - Shippers see their bookings
 * - Carriers see bookings for their trucks
 * - Drivers see assigned bookings
 * - Admins see all bookings
 */
router.get(
  '/',
  authenticate,
  BookingController.getUserBookings
);

/**
 * GET /api/v1/bookings/dashboard
 * Get bookings for dashboard display (read-only view)
 * This endpoint allows viewing bookings without strict account activation
 * Following Uber/Rapido model where users can view but not modify
 */
router.get(
  '/dashboard',
  authenticate,
  BookingController.getDashboardBookings
);

/**
 * POST /api/v1/bookings
 * Create new booking (shippers only)
 * Enforces: ₹5/tonne/km pricing, max 7 days advance, min 1 hour before
 */
router.post(
  '/',
  authenticate,
  authorize('shipper'),
  checkRateLimit('create-booking', 50, 3600), // 50 bookings per hour
  bookingValidation.create,
  BookingController.createBooking
);

/**
 * GET /api/v1/bookings/stats
 * Get booking statistics (admin only)
 */
router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  BookingController.getBookingStats
);

/**
 * GET /api/v1/bookings/:bookingId
 * Get booking details
 * Authorization: Owner, assigned carrier/driver, or admin
 */
router.get(
  '/:bookingId',
  authenticate,
  commonValidation.uuidParam('bookingId'),
  BookingController.getBookingById
);

/**
 * PUT /api/v1/bookings/:bookingId/status
 * Update booking status
 * - Drivers can update: picked_up, in_transit, delivered
 * - Admins can update any status
 */
router.put(
  '/:bookingId/status',
  authenticate,
  commonValidation.uuidParam('bookingId'),
  bookingValidation.updateStatus,
  BookingController.updateBookingStatus
);

/**
 * POST /api/v1/bookings/:bookingId/cancel
 * Cancel booking
 * Must be at least 2 hours before pickup time
 */
router.post(
  '/:bookingId/cancel',
  authenticate,
  commonValidation.uuidParam('bookingId'),
  bookingValidation.cancel,
  BookingController.cancelBooking
);

/**
 * POST /api/v1/bookings/:bookingId/pod
 * Upload Proof of Delivery
 * Max 2MB as per frozen requirements
 */
router.post(
  '/:bookingId/pod',
  authenticate,
  authorize('driver', 'admin'),
  commonValidation.uuidParam('bookingId'),
  bookingValidation.uploadPOD,
  BookingController.uploadPOD
);

/**
 * POST /api/v1/bookings/:bookingId/assign-truck
 * Manually assign truck to booking
 * Carriers and admins only
 */
router.post(
  '/:bookingId/assign-truck',
  authenticate,
  authorize('carrier', 'admin'),
  commonValidation.uuidParam('bookingId'),
  bookingValidation.assignTruck,
  BookingController.assignTruck
);

/**
 * API Documentation
 */
router.get('/docs', (req, res) => {
  res.json({
    service: 'Booking Service',
    version: '1.0.0',
    frozen_requirements: {
      pricing: '₹5/tonne/km (FROZEN)',
      gst: '18%',
      booking_window: {
        max_advance: '7 days',
        min_notice: '1 hour'
      },
      cancellation: '2 hours before pickup',
      pod_size: 'Max 2MB',
      status_stages: [
        'created',
        'assigned',
        'picked_up',
        'in_transit',
        'delivered',
        'cancelled'
      ]
    },
    endpoints: {
      'GET /': 'List bookings (filtered by user role)',
      'POST /': 'Create new booking (shippers only)',
      'GET /stats': 'Booking statistics (admin only)',
      'GET /:id': 'Get booking details',
      'PUT /:id/status': 'Update booking status',
      'POST /:id/cancel': 'Cancel booking',
      'POST /:id/pod': 'Upload proof of delivery',
      'POST /:id/assign-truck': 'Manually assign truck'
    },
    rate_limits: {
      create_booking: '50 requests per hour',
      general: '100 requests per minute'
    }
  });
});

module.exports = router;