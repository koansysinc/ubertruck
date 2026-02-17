/**
 * Admin Routes
 * Administrative endpoints and dashboard
 * Complete system oversight and management
 */

const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const {
  authenticate,
  authorize
} = require('../middleware/authMiddleware');
const { commonValidation } = require('../middleware/validation');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

/**
 * GET /api/v1/admin/dashboard
 * Main admin dashboard with comprehensive metrics
 */
router.get('/dashboard', AdminController.getDashboard);

/**
 * GET /api/v1/admin/users
 * Get all users with filtering and pagination
 */
router.get('/users', AdminController.getUsers);

/**
 * PUT /api/v1/admin/users/:userId/status
 * Update user status (activate/suspend/deactivate)
 */
router.put(
  '/users/:userId/status',
  commonValidation.uuidParam('userId'),
  AdminController.updateUserStatus
);

/**
 * GET /api/v1/admin/bookings
 * Get all bookings with advanced filtering
 */
router.get('/bookings', AdminController.getAllBookings);

/**
 * GET /api/v1/admin/reports
 * Generate various reports (revenue, operations, fleet, compliance)
 */
router.get('/reports', AdminController.generateReport);

/**
 * POST /api/v1/admin/disputes
 * Handle booking disputes and refunds
 */
router.post('/disputes', AdminController.handleDispute);

/**
 * API Documentation
 */
router.get('/docs', (req, res) => {
  res.json({
    service: 'Admin Service',
    version: '1.0.0',
    description: 'Administrative dashboard and system management',
    requirements: {
      authentication: 'JWT token required',
      authorization: 'Admin role required for all endpoints',
      auditLogging: 'All operations are audit logged'
    },
    endpoints: {
      'GET /dashboard': 'Comprehensive dashboard metrics',
      'GET /users': 'User management with filtering',
      'PUT /users/:id/status': 'Update user status',
      'GET /bookings': 'View all bookings with filtering',
      'GET /reports': 'Generate reports (revenue, operations, fleet, compliance)',
      'POST /disputes': 'Handle disputes and refunds'
    },
    reportTypes: {
      revenue: 'Revenue and financial metrics',
      operations: 'Operational performance metrics',
      fleet: 'Fleet utilization and status',
      compliance: 'Frozen requirements compliance check'
    },
    metrics: {
      systemOverview: 'Active users, bookings, trucks, revenue',
      trends: 'Daily/weekly/monthly trends',
      performance: 'Delivery times, cancellation rates',
      compliance: 'Pricing, fleet, corridor compliance'
    },
    frozenRequirements: {
      pricing: '₹5/tonne/km (monitored)',
      gst: '18% (monitored)',
      fleetTypes: '10T, 15T, 20T only (enforced)',
      corridor: 'Nalgonda-Miryalguda only (enforced)',
      manualPayments: 'No payment gateway (enforced)'
    }
  });
});

module.exports = router;