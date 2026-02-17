/**
 * Payment Controller
 * Manual payment processing as per frozen requirements (NO payment gateway)
 * Invoice generation with GST (18%)
 */

const { query, transaction } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');
const { auditLog } = require('../middleware/loggingMiddleware');
const winston = require('winston');

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

class PaymentController {
  /**
   * Get all invoices
   * GET /api/v1/payments/invoices
   */
  static async getInvoices(req, res) {
    try {
      let sql = `
        SELECT
          p.*,
          b.booking_number,
          b.pickup_location,
          b.delivery_location,
          b.cargo_type,
          b.cargo_weight_tonnes,
          s.company_name as shipper_name,
          s.gst_number as shipper_gst
        FROM payments p
        JOIN bookings b ON p.booking_id = b.booking_id
        JOIN shippers s ON b.shipper_id = s.shipper_id
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      // Filter by user role
      if (req.user.role === 'shipper') {
        sql += ` AND b.shipper_id = $${paramIndex}`;
        params.push(req.user.shipperId);
        paramIndex++;
      }

      // Filter by status
      if (req.query.status) {
        sql += ` AND p.status = $${paramIndex}`;
        params.push(req.query.status);
        paramIndex++;
      }

      // Date range filter
      if (req.query.startDate) {
        sql += ` AND p.created_at >= $${paramIndex}`;
        params.push(req.query.startDate);
        paramIndex++;
      }

      if (req.query.endDate) {
        sql += ` AND p.created_at <= $${paramIndex}`;
        params.push(req.query.endDate);
        paramIndex++;
      }

      sql += ' ORDER BY p.created_at DESC LIMIT 100';

      const result = await query(sql, params);

      res.json({
        success: true,
        count: result.rows.length,
        invoices: result.rows
      });
    } catch (error) {
      logger.error('Get invoices error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to retrieve invoices',
          code: 'INVOICES_FETCH_ERROR'
        }
      });
    }
  }

  /**
   * Get invoice by ID
   * GET /api/v1/payments/invoices/:invoiceId
   */
  static async getInvoiceById(req, res) {
    try {
      const { invoiceId } = req.params;

      const sql = `
        SELECT
          p.*,
          b.booking_number,
          b.pickup_location,
          b.delivery_location,
          b.pickup_date,
          b.actual_delivery_time,
          b.cargo_type,
          b.cargo_weight_tonnes,
          b.distance_km,
          s.company_name as shipper_name,
          s.gst_number as shipper_gst,
          s.address as shipper_address,
          s.email as shipper_email,
          u.phone_number as shipper_phone
        FROM payments p
        JOIN bookings b ON p.booking_id = b.booking_id
        JOIN shippers s ON b.shipper_id = s.shipper_id
        JOIN users u ON s.user_id = u.user_id
        WHERE p.payment_id = $1
      `;

      const result = await query(sql, [invoiceId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: {
            message: 'Invoice not found',
            code: 'INVOICE_NOT_FOUND'
          }
        });
      }

      const invoice = result.rows[0];

      // Check authorization
      if (req.user.role === 'shipper') {
        const bookingResult = await query(
          'SELECT shipper_id FROM bookings WHERE booking_id = $1',
          [invoice.booking_id]
        );

        if (bookingResult.rows[0].shipper_id !== req.user.shipperId) {
          return res.status(403).json({
            error: {
              message: 'Unauthorized to view this invoice',
              code: 'UNAUTHORIZED_ACCESS'
            }
          });
        }
      }

      // Calculate breakdown (frozen at ₹5/tonne/km, 18% GST)
      const ratePerTonnePerKm = 5;
      const gstRate = 0.18;
      const baseAmount = invoice.distance_km * invoice.cargo_weight_tonnes * ratePerTonnePerKm;
      const gstAmount = baseAmount * gstRate;
      const totalAmount = baseAmount + gstAmount;

      res.json({
        success: true,
        invoice: {
          ...invoice,
          breakdown: {
            rate: `₹${ratePerTonnePerKm}/tonne/km`,
            distance: `${invoice.distance_km} km`,
            weight: `${invoice.cargo_weight_tonnes} tonnes`,
            baseAmount: `₹${baseAmount.toFixed(2)}`,
            gstRate: '18%',
            gstAmount: `₹${gstAmount.toFixed(2)}`,
            totalAmount: `₹${totalAmount.toFixed(2)}`
          }
        }
      });
    } catch (error) {
      logger.error('Get invoice error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to retrieve invoice',
          code: 'INVOICE_FETCH_ERROR'
        }
      });
    }
  }

  /**
   * Generate invoice for booking
   * POST /api/v1/payments/invoices/generate
   */
  static async generateInvoice(req, res) {
    try {
      const { bookingId } = req.body;

      // Check if invoice already exists
      const existingInvoice = await query(
        'SELECT * FROM payments WHERE booking_id = $1',
        [bookingId]
      );

      if (existingInvoice.rows.length > 0) {
        return res.status(400).json({
          error: {
            message: 'Invoice already exists for this booking',
            code: 'INVOICE_EXISTS'
          }
        });
      }

      // Get booking details
      const bookingResult = await query(
        `SELECT
          b.*,
          s.company_name as shipper_name
        FROM bookings b
        JOIN shippers s ON b.shipper_id = s.shipper_id
        WHERE b.booking_id = $1`,
        [bookingId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({
          error: {
            message: 'Booking not found',
            code: 'BOOKING_NOT_FOUND'
          }
        });
      }

      const booking = bookingResult.rows[0];

      // Check if booking is delivered
      if (booking.status !== 'delivered') {
        return res.status(400).json({
          error: {
            message: 'Invoice can only be generated for delivered bookings',
            code: 'INVALID_BOOKING_STATUS'
          }
        });
      }

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Create invoice
      const invoiceSql = `
        INSERT INTO payments (
          payment_id,
          booking_id,
          invoice_number,
          amount,
          gst_amount,
          total_amount,
          payment_method,
          status,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *
      `;

      const invoiceParams = [
        uuidv4(),
        bookingId,
        invoiceNumber,
        booking.base_price,
        booking.gst_amount,
        booking.total_price,
        'manual',
        'pending'
      ];

      const invoiceResult = await query(invoiceSql, invoiceParams);
      const invoice = invoiceResult.rows[0];

      // Audit log
      auditLog('INVOICE_GENERATED', {
        invoiceId: invoice.payment_id,
        invoiceNumber: invoice.invoice_number,
        bookingId: bookingId,
        amount: invoice.total_amount
      }, req);

      logger.info('Invoice generated', {
        invoiceId: invoice.payment_id,
        bookingId: bookingId,
        amount: invoice.total_amount
      });

      res.status(201).json({
        success: true,
        message: 'Invoice generated successfully',
        invoice
      });
    } catch (error) {
      logger.error('Generate invoice error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to generate invoice',
          code: 'INVOICE_GENERATION_ERROR'
        }
      });
    }
  }

  /**
   * Record manual payment
   * POST /api/v1/payments/invoices/:invoiceId/record-payment
   */
  static async recordPayment(req, res) {
    try {
      const { invoiceId } = req.params;
      const {
        paymentReference,
        paymentDate,
        paymentMode,
        bankName,
        notes
      } = req.body;

      // Validate admin or authorized user
      if (!['admin', 'carrier'].includes(req.user.role)) {
        return res.status(403).json({
          error: {
            message: 'Only admins and carriers can record payments',
            code: 'UNAUTHORIZED_ROLE'
          }
        });
      }

      // Get invoice
      const invoiceResult = await query(
        'SELECT * FROM payments WHERE payment_id = $1',
        [invoiceId]
      );

      if (invoiceResult.rows.length === 0) {
        return res.status(404).json({
          error: {
            message: 'Invoice not found',
            code: 'INVOICE_NOT_FOUND'
          }
        });
      }

      const invoice = invoiceResult.rows[0];

      if (invoice.status === 'completed') {
        return res.status(400).json({
          error: {
            message: 'Payment already recorded for this invoice',
            code: 'PAYMENT_ALREADY_RECORDED'
          }
        });
      }

      // Update payment record
      const updateSql = `
        UPDATE payments
        SET
          payment_reference = $2,
          payment_date = $3,
          status = 'completed',
          updated_at = NOW(),
          payment_method = $4
        WHERE payment_id = $1
        RETURNING *
      `;

      const updateParams = [
        invoiceId,
        paymentReference,
        paymentDate || new Date(),
        paymentMode || 'manual'
      ];

      const updateResult = await query(updateSql, updateParams);
      const updatedInvoice = updateResult.rows[0];

      // Audit log - Critical financial operation
      auditLog('PAYMENT_RECORDED', {
        invoiceId: invoiceId,
        paymentReference: paymentReference,
        amount: updatedInvoice.total_amount,
        paymentMode: paymentMode,
        recordedBy: req.user.userId
      }, req);

      logger.info('Payment recorded', {
        invoiceId: invoiceId,
        amount: updatedInvoice.total_amount,
        userId: req.user.userId
      });

      res.json({
        success: true,
        message: 'Payment recorded successfully',
        invoice: updatedInvoice
      });
    } catch (error) {
      logger.error('Record payment error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to record payment',
          code: 'PAYMENT_RECORD_ERROR'
        }
      });
    }
  }

  /**
   * Get payment statistics
   * GET /api/v1/payments/stats
   */
  static async getPaymentStats(req, res) {
    try {
      // Admin only
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          error: {
            message: 'Admin access required',
            code: 'ADMIN_ONLY'
          }
        });
      }

      const { startDate, endDate } = req.query;

      let sql = `
        SELECT
          COUNT(*) as total_invoices,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_payments,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_payments,
          SUM(total_amount) FILTER (WHERE status = 'completed') as total_collected,
          SUM(total_amount) FILTER (WHERE status = 'pending') as total_pending,
          AVG(total_amount) as average_invoice_amount,
          SUM(gst_amount) as total_gst_collected
        FROM payments
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (startDate) {
        sql += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        sql += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      const result = await query(sql, params);
      const stats = result.rows[0];

      // Get payment trends
      const trendsSql = `
        SELECT
          DATE_TRUNC('day', payment_date) as date,
          COUNT(*) as payments,
          SUM(total_amount) as amount
        FROM payments
        WHERE status = 'completed'
          AND payment_date >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', payment_date)
        ORDER BY date DESC
      `;

      const trendsResult = await query(trendsSql);

      res.json({
        success: true,
        stats: {
          ...stats,
          trends: trendsResult.rows
        }
      });
    } catch (error) {
      logger.error('Get payment stats error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to retrieve payment statistics',
          code: 'STATS_FETCH_ERROR'
        }
      });
    }
  }

  /**
   * Download invoice (returns invoice data for PDF generation)
   * GET /api/v1/payments/invoices/:invoiceId/download
   */
  static async downloadInvoice(req, res) {
    try {
      const { invoiceId } = req.params;

      // Get complete invoice data
      const sql = `
        SELECT
          p.*,
          b.*,
          s.company_name,
          s.gst_number,
          s.address as company_address,
          s.email as company_email,
          u.phone_number as company_phone,
          t.vehicle_number,
          d.full_name as driver_name
        FROM payments p
        JOIN bookings b ON p.booking_id = b.booking_id
        JOIN shippers s ON b.shipper_id = s.shipper_id
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN trucks t ON b.truck_id = t.truck_id
        LEFT JOIN drivers d ON b.driver_id = d.driver_id
        WHERE p.payment_id = $1
      `;

      const result = await query(sql, [invoiceId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: {
            message: 'Invoice not found',
            code: 'INVOICE_NOT_FOUND'
          }
        });
      }

      const invoice = result.rows[0];

      // Format invoice data for download
      const invoiceData = {
        invoiceNumber: invoice.invoice_number,
        invoiceDate: invoice.created_at,
        dueDate: new Date(invoice.created_at.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days

        // Company details
        from: {
          name: 'UberTruck Logistics Pvt Ltd',
          address: 'Transport Nagar, Nalgonda, Telangana - 508001',
          gst: '36AABCU9603R1ZX',
          phone: '+91-8500-123-456',
          email: 'billing@ubertruck.com'
        },

        // Customer details
        to: {
          name: invoice.company_name,
          gst: invoice.gst_number,
          address: invoice.company_address,
          phone: invoice.company_phone,
          email: invoice.company_email
        },

        // Booking details
        booking: {
          number: invoice.booking_number,
          date: invoice.pickup_date,
          pickup: invoice.pickup_location,
          delivery: invoice.delivery_location,
          distance: `${invoice.distance_km} km`,
          weight: `${invoice.cargo_weight_tonnes} tonnes`,
          cargoType: invoice.cargo_type,
          vehicle: invoice.vehicle_number,
          driver: invoice.driver_name
        },

        // Pricing (FROZEN at ₹5/tonne/km)
        pricing: {
          rate: '₹5.00 per tonne per km',
          calculation: `${invoice.distance_km} km × ${invoice.cargo_weight_tonnes} tonnes × ₹5`,
          baseAmount: invoice.amount,
          gstRate: '18%',
          gstAmount: invoice.gst_amount,
          totalAmount: invoice.total_amount
        },

        // Payment details
        payment: {
          status: invoice.status,
          reference: invoice.payment_reference,
          date: invoice.payment_date,
          method: invoice.payment_method
        }
      };

      // In production, this would generate a PDF
      // For now, return JSON data that can be used for PDF generation
      res.json({
        success: true,
        invoice: invoiceData
      });
    } catch (error) {
      logger.error('Download invoice error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to download invoice',
          code: 'INVOICE_DOWNLOAD_ERROR'
        }
      });
    }
  }

  /**
   * Calculate price for a booking
   * POST /api/v1/payments/calculate
   * FROZEN REQUIREMENT: ₹5/tonne/km, 18% GST
   */
  static async calculatePrice(req, res) {
    try {
      const { distance, weight, pickupPincode, deliveryPincode, cargoType, cargoDescription } = req.body;

      // FROZEN: ₹5/tonne/km
      const RATE_PER_TONNE_KM = 5;
      const basePrice = distance * weight * RATE_PER_TONNE_KM;

      // Fuel surcharge (10% of base)
      const fuelSurcharge = basePrice * 0.1;

      const subtotal = basePrice + fuelSurcharge;

      // FROZEN: 18% GST
      const GST_RATE = 0.18;

      // Check if interstate (different first 2 digits of pincode)
      const isInterstate = pickupPincode && deliveryPincode &&
                          pickupPincode.substring(0, 2) !== deliveryPincode.substring(0, 2);

      let gst;
      if (isInterstate) {
        // Interstate: IGST 18%
        gst = {
          cgst: 0,
          sgst: 0,
          igst: subtotal * GST_RATE,
          taxableAmount: subtotal
        };
      } else {
        // Intrastate: CGST 9% + SGST 9%
        gst = {
          cgst: subtotal * (GST_RATE / 2),
          sgst: subtotal * (GST_RATE / 2),
          igst: 0,
          taxableAmount: subtotal
        };
      }

      const totalAmount = subtotal + gst.cgst + gst.sgst + gst.igst;

      res.json({
        success: true,
        basePrice,
        fuelSurcharge,
        gst,
        totalAmount,
        distance,  // Added for frontend display
        cargoDetails: {  // Added for frontend display
          weight,
          type: cargoType || 'GENERAL',
          description: cargoDescription || ''
        },
        breakdown: {
          distance: `${distance} km`,
          weight: `${weight} tonnes`,
          rate: `₹${RATE_PER_TONNE_KM}/tonne/km (FROZEN)`,
          gstRate: `${GST_RATE * 100}% (FROZEN)`
        },
        validUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
      });
    } catch (error) {
      logger.error('Calculate price error:', error);
      res.status(500).json({
        error: {
          message: 'Failed to calculate price',
          code: 'PRICE_CALCULATION_ERROR'
        }
      });
    }
  }
}

module.exports = PaymentController;