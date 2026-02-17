/**
 * Payment Routes
 * Payment and invoice management endpoints
 * FROZEN REQUIREMENT: Manual payment processing only (NO payment gateway)
 */

const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const {
  authenticate,
  authorize,
  checkRateLimit
} = require('../middleware/authMiddleware');
const { commonValidation } = require('../middleware/validation');

/**
 * GET /api/v1/payments/invoices
 * List all invoices (filtered by user role)
 */
router.get(
  '/invoices',
  authenticate,
  PaymentController.getInvoices
);

/**
 * GET /api/v1/payments/stats
 * Payment statistics (admin only)
 */
router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  PaymentController.getPaymentStats
);

/**
 * POST /api/v1/payments/invoices/generate
 * Generate invoice for delivered booking
 */
router.post(
  '/invoices/generate',
  authenticate,
  authorize('admin', 'carrier'),
  checkRateLimit('generate-invoice', 100, 3600),
  PaymentController.generateInvoice
);

/**
 * GET /api/v1/payments/invoices/:invoiceId
 * Get specific invoice details
 */
router.get(
  '/invoices/:invoiceId',
  authenticate,
  commonValidation.uuidParam('invoiceId'),
  PaymentController.getInvoiceById
);

/**
 * POST /api/v1/payments/invoices/:invoiceId/record-payment
 * Record manual payment for invoice
 */
router.post(
  '/invoices/:invoiceId/record-payment',
  authenticate,
  authorize('admin', 'carrier'),
  commonValidation.uuidParam('invoiceId'),
  PaymentController.recordPayment
);

/**
 * GET /api/v1/payments/invoices/:invoiceId/download
 * Download invoice data (for PDF generation)
 */
router.get(
  '/invoices/:invoiceId/download',
  authenticate,
  commonValidation.uuidParam('invoiceId'),
  PaymentController.downloadInvoice
);

/**
 * POST /api/v1/payments/calculate
 * Calculate price for a booking
 * FROZEN REQUIREMENT: ₹5/tonne/km, 18% GST
 */
router.post(
  '/calculate',
  PaymentController.calculatePrice
);

/**
 * API Documentation
 */
router.get('/docs', (req, res) => {
  res.json({
    service: 'Payment Service',
    version: '1.0.0',
    frozen_requirements: {
      payment_processing: 'MANUAL ONLY - No payment gateway',
      gst_rate: '18% (FROZEN)',
      pricing: '₹5/tonne/km (FROZEN)',
      invoice_generation: 'For delivered bookings only',
      payment_methods: ['Bank Transfer', 'Cheque', 'Cash', 'UPI']
    },
    endpoints: {
      'GET /invoices': 'List invoices',
      'GET /stats': 'Payment statistics (admin only)',
      'POST /invoices/generate': 'Generate invoice for booking',
      'GET /invoices/:id': 'Get invoice details',
      'POST /invoices/:id/record-payment': 'Record manual payment',
      'GET /invoices/:id/download': 'Download invoice data'
    },
    compliance: {
      gst: 'All invoices include 18% GST',
      audit: 'All payment operations are audit logged',
      authorization: 'Role-based access control enforced'
    }
  });
});

module.exports = router;