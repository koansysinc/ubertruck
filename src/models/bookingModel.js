/**
 * Booking Model
 * Handles all database operations for bookings
 */

const { query, transaction } = require('../database/connection');
const { generateBookingNumber, calculateDistance, calculatePrice } = require('../utils/auth');

class BookingModel {
  /**
   * Create new booking
   */
  static async createBooking(shipperId, bookingData) {
    return await transaction(async (client) => {
      // Calculate distance and price
      const distance = calculateDistance(
        bookingData.pickupLat,
        bookingData.pickupLng,
        bookingData.deliveryLat,
        bookingData.deliveryLng
      );

      const pricing = calculatePrice(distance, bookingData.cargoWeight);

      // Create booking
      const bookingSql = `
        INSERT INTO bookings (
          booking_number, shipper_id,
          pickup_location, pickup_address, pickup_pincode, pickup_lat, pickup_lng,
          delivery_location, delivery_address, delivery_pincode, delivery_lat, delivery_lng,
          cargo_type, cargo_weight, cargo_description, special_instructions,
          pickup_date, estimated_delivery_date,
          distance, base_price, gst_amount, total_price,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING *
      `;

      const bookingParams = [
        generateBookingNumber(),
        shipperId,
        bookingData.pickupLocation,
        bookingData.pickupAddress || null,
        bookingData.pickupPincode || null,
        bookingData.pickupLat,
        bookingData.pickupLng,
        bookingData.deliveryLocation,
        bookingData.deliveryAddress || null,
        bookingData.deliveryPincode || null,
        bookingData.deliveryLat,
        bookingData.deliveryLng,
        bookingData.cargoType,
        bookingData.cargoWeight,
        bookingData.cargoDescription || null,
        bookingData.specialInstructions || null,
        bookingData.pickupDate,
        bookingData.estimatedDeliveryDate || bookingData.pickupDate,
        distance,
        pricing.basePrice,
        pricing.gstAmount,
        pricing.totalPrice,
        'created'
      ];

      const bookingResult = await client.query(bookingSql, bookingParams);
      const booking = bookingResult.rows[0];

      // Add to status history
      const historySql = `
        INSERT INTO booking_status_history (booking_id, status, notes)
        VALUES ($1, $2, $3)
      `;

      await client.query(historySql, [
        booking.booking_id,
        'created',
        'Booking created'
      ]);

      // Try to auto-assign truck if weight matches capacity
      const truckSql = `
        SELECT truck_id, vehicle_number, driver_id
        FROM trucks
        WHERE is_available = true
          AND capacity_tonnes >= $1
          AND vehicle_type = $2
        ORDER BY capacity_tonnes ASC
        LIMIT 1
      `;

      // Determine truck type based on weight
      let truckType = '10T';
      if (bookingData.cargoWeight > 10 && bookingData.cargoWeight <= 15) {
        truckType = '15T';
      } else if (bookingData.cargoWeight > 15) {
        truckType = '20T';
      }

      const truckResult = await client.query(truckSql, [
        bookingData.cargoWeight,
        truckType
      ]);

      if (truckResult.rows.length > 0) {
        const truck = truckResult.rows[0];

        // Assign truck to booking
        await client.query(
          `UPDATE bookings
           SET truck_id = $1, driver_id = $2, status = 'assigned'
           WHERE booking_id = $3`,
          [truck.truck_id, truck.driver_id, booking.booking_id]
        );

        // Update truck status
        await client.query(
          `UPDATE trucks SET is_available = false WHERE truck_id = $1`,
          [truck.truck_id]
        );

        // Add to history
        await client.query(historySql, [
          booking.booking_id,
          'assigned',
          `Auto-assigned truck ${truck.vehicle_number}`
        ]);

        booking.truck_id = truck.truck_id;
        booking.driver_id = truck.driver_id;
        booking.status = 'assigned';
      }

      return booking;
    });
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(bookingId) {
    const sql = `
      SELECT
        b.*,
        u.business_name as shipper_company,
        t.vehicle_number,
        t.vehicle_type as truck_type,
        d.full_name as driver_name,
        du.phone_number as driver_phone
      FROM bookings b
      JOIN users u ON b.shipper_id = u.user_id
      LEFT JOIN trucks t ON b.truck_id = t.truck_id
      LEFT JOIN drivers d ON b.driver_id = d.driver_id
      LEFT JOIN users du ON d.user_id = du.user_id
      WHERE b.booking_id = $1
    `;

    const result = await query(sql, [bookingId]);
    return result.rows[0];
  }

  /**
   * Get bookings for shipper
   */
  static async getShipperBookings(shipperId, filters = {}) {
    let sql = `
      SELECT
        b.*,
        t.vehicle_number,
        d.full_name as driver_name
      FROM bookings b
      LEFT JOIN trucks t ON b.truck_id = t.truck_id
      LEFT JOIN drivers d ON b.driver_id = d.driver_id
      WHERE b.shipper_id = $1
    `;

    const params = [shipperId];
    let paramCount = 2;

    if (filters.status) {
      sql += ` AND b.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.startDate) {
      sql += ` AND b.pickup_date >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      sql += ` AND b.pickup_date <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    sql += ' ORDER BY b.created_at DESC';

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get bookings for shipper by user_id (for dashboard)
   */
  static async getShipperBookingsByUserId(userId, filters = {}) {
    let sql = `
      SELECT
        b.*,
        t.vehicle_number,
        d.full_name as driver_name,
        t.vehicle_type as truck_type,
        du.phone_number as driver_phone
      FROM bookings b
      LEFT JOIN users u ON b.shipper_id = u.user_id
      LEFT JOIN trucks t ON b.truck_id = t.truck_id
      LEFT JOIN drivers d ON b.driver_id = d.driver_id
      LEFT JOIN users du ON d.user_id = du.user_id
      WHERE u.user_id = $1
    `;

    const params = [userId];
    let paramCount = 2;

    if (filters.status) {
      sql += ` AND b.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.startDate) {
      sql += ` AND b.pickup_date >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      sql += ` AND b.pickup_date <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    sql += ' ORDER BY b.created_at DESC';

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get bookings for carrier (through trucks)
   */
  static async getCarrierBookings(carrierId, filters = {}) {
    let sql = `
      SELECT
        b.*,
        s.company_name as shipper_company,
        t.vehicle_number,
        d.full_name as driver_name
      FROM bookings b
      JOIN trucks t ON b.truck_id = t.truck_id
      JOIN carriers c ON t.carrier_id = c.carrier_id
      JOIN shippers s ON b.shipper_id = s.shipper_id
      LEFT JOIN drivers d ON b.driver_id = d.driver_id
      WHERE c.carrier_id = $1
    `;

    const params = [carrierId];
    let paramCount = 2;

    if (filters.status) {
      sql += ` AND b.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    sql += ' ORDER BY b.created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get all bookings (for admin)
   */
  static async getAllBookings(filters = {}) {
    let sql = `
      SELECT
        b.*,
        t.vehicle_number,
        d.full_name as driver_name,
        t.vehicle_type as truck_type,
        u.phone_number as shipper_phone,
        u.business_name as shipper_name
      FROM bookings b
      LEFT JOIN users u ON b.shipper_id = u.user_id
      LEFT JOIN trucks t ON b.truck_id = t.truck_id
      LEFT JOIN drivers d ON b.driver_id = d.driver_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.status) {
      sql += ` AND b.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.startDate) {
      sql += ` AND b.pickup_date >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      sql += ` AND b.pickup_date <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    sql += ' ORDER BY b.created_at DESC';

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get bookings for driver
   */
  static async getDriverBookings(driverId) {
    const sql = `
      SELECT
        b.*,
        u.business_name as shipper_company,
        u.phone_number as shipper_phone,
        t.vehicle_number,
        t.vehicle_type as truck_type
      FROM bookings b
      JOIN users u ON b.shipper_id = u.user_id
      LEFT JOIN trucks t ON b.truck_id = t.truck_id
      WHERE b.driver_id = $1
        AND b.status IN ('assigned', 'picked_up', 'in_transit')
      ORDER BY b.pickup_date ASC
    `;

    const result = await query(sql, [driverId]);
    return result.rows;
  }

  /**
   * Update booking status
   */
  static async updateBookingStatus(bookingId, status, userId, notes = null) {
    return await transaction(async (client) => {
      // Update booking
      const updateSql = `
        UPDATE bookings
        SET status = $2, updated_at = CURRENT_TIMESTAMP
        WHERE booking_id = $1
        RETURNING *
      `;

      const result = await client.query(updateSql, [bookingId, status]);
      const booking = result.rows[0];

      // Add to history
      await client.query(
        `INSERT INTO booking_status_history (booking_id, status, changed_by, notes)
         VALUES ($1, $2, $3, $4)`,
        [bookingId, status, userId, notes]
      );

      // Update truck status based on booking status
      if (booking.truck_id) {
        let isAvailable = false;
        if (status === 'delivered' || status === 'cancelled') {
          isAvailable = true;
        }

        await client.query(
          `UPDATE trucks SET is_available = $1 WHERE truck_id = $2`,
          [isAvailable, booking.truck_id]
        );
      }

      // Set actual times
      if (status === 'picked_up') {
        await client.query(
          `UPDATE bookings SET actual_pickup_time = CURRENT_TIMESTAMP WHERE booking_id = $1`,
          [bookingId]
        );
      } else if (status === 'delivered') {
        await client.query(
          `UPDATE bookings SET actual_delivery_time = CURRENT_TIMESTAMP WHERE booking_id = $1`,
          [bookingId]
        );
      }

      return booking;
    });
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(bookingId, userId, reason) {
    return await transaction(async (client) => {
      // Update booking
      const result = await client.query(
        `UPDATE bookings
         SET status = 'cancelled',
             cancellation_reason = $2,
             cancelled_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE booking_id = $1
         RETURNING *`,
        [bookingId, reason]
      );

      const booking = result.rows[0];

      // Free up truck if assigned
      if (booking.truck_id) {
        await client.query(
          `UPDATE trucks SET is_available = true WHERE truck_id = $1`,
          [booking.truck_id]
        );
      }

      // Add to history
      await client.query(
        `INSERT INTO booking_status_history (booking_id, status, changed_by, notes)
         VALUES ($1, 'cancelled', $2, $3)`,
        [bookingId, userId, reason]
      );

      return booking;
    });
  }

  /**
   * Upload POD
   */
  static async uploadPOD(bookingId, podUrl) {
    const sql = `
      UPDATE bookings
      SET pod_url = $2, pod_uploaded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $1
      RETURNING *
    `;

    const result = await query(sql, [bookingId, podUrl]);
    return result.rows[0];
  }

  /**
   * Get booking statistics
   */
  static async getBookingStats(filters = {}) {
    let sql = `
      SELECT
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'created') as pending_bookings,
        COUNT(*) FILTER (WHERE status = 'assigned') as assigned_bookings,
        COUNT(*) FILTER (WHERE status IN ('picked_up', 'in_transit')) as active_bookings,
        COUNT(*) FILTER (WHERE status = 'delivered') as completed_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
        SUM(total_price) FILTER (WHERE status = 'delivered') as total_revenue,
        AVG(distance_km) as avg_distance,
        AVG(cargo_weight_tonnes) as avg_weight
      FROM bookings
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.startDate) {
      sql += ` AND created_at >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      sql += ` AND created_at <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    const result = await query(sql, params);
    return result.rows[0];
  }

  /**
   * Get booking history
   */
  static async getBookingHistory(bookingId) {
    const sql = `
      SELECT
        h.*,
        u.phone_number as changed_by_phone
      FROM booking_status_history h
      LEFT JOIN users u ON h.changed_by = u.user_id
      WHERE h.booking_id = $1
      ORDER BY h.created_at ASC
    `;

    const result = await query(sql, [bookingId]);
    return result.rows;
  }

  /**
   * Assign truck to booking
   */
  static async assignTruck(bookingId, truckId, driverId = null) {
    return await transaction(async (client) => {
      // Update booking
      const result = await client.query(
        `UPDATE bookings
         SET truck_id = $2, driver_id = $3, status = 'assigned'
         WHERE booking_id = $1
         RETURNING *`,
        [bookingId, truckId, driverId]
      );

      const booking = result.rows[0];

      // Update truck status
      await client.query(
        `UPDATE trucks SET is_available = false WHERE truck_id = $1`,
        [truckId]
      );

      // Add to history
      await client.query(
        `INSERT INTO booking_status_history (booking_id, status, notes)
         VALUES ($1, 'assigned', $2)`,
        [bookingId, `Truck assigned: ${truckId}`]
      );

      return booking;
    });
  }
}

module.exports = BookingModel;