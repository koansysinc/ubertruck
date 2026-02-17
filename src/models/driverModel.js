/**
 * Driver Model
 * Handles all database operations for drivers
 */

const { query, transaction } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class DriverModel {
  /**
   * Find driver by phone number
   */
  static async findByPhone(phoneNumber) {
    const sql = `
      SELECT d.*, u.user_id
      FROM drivers d
      LEFT JOIN users u ON d.user_id = u.user_id
      WHERE d.phone_number = $1
    `;

    const result = await query(sql, [phoneNumber]);
    return result.rows[0] || null;
  }

  /**
   * Find driver by ID
   */
  static async findById(driverId) {
    const sql = `
      SELECT d.*
      FROM drivers d
      LEFT JOIN users u ON d.user_id = u.user_id
      WHERE d.driver_id = $1
    `;

    const result = await query(sql, [driverId]);
    return result.rows[0] || null;
  }

  /**
   * Create new driver
   */
  static async create(driverData) {
    const client = await transaction();

    try {
      // First create user account
      const userSql = `
        INSERT INTO users (user_id, phone_number, role, created_at)
        VALUES ($1, $2, 'driver', $3)
        RETURNING *
      `;

      const userId = uuidv4();
      const userResult = await client.query(userSql, [
        userId,
        driverData.phone_number,
        new Date()
      ]);

      // Then create driver profile
      const driverSql = `
        INSERT INTO drivers (
          driver_id, user_id, full_name, phone_number, license_number,
          vehicle_number, vehicle_type, aadhar_number, pan_number,
          bank_account_number, bank_ifsc, bank_account_name,
          status, is_available, is_online, total_trips, total_earnings,
          rating, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20
        ) RETURNING *
      `;

      const driverResult = await client.query(driverSql, [
        driverData.driver_id,
        userId,
        driverData.full_name,
        driverData.phone_number,
        driverData.license_number,
        driverData.vehicle_number,
        driverData.vehicle_type,
        driverData.aadhar_number,
        driverData.pan_number,
        driverData.bank_account_number,
        driverData.bank_ifsc,
        driverData.bank_account_name,
        driverData.status,
        false, // is_available
        false, // is_online
        0, // total_trips
        0, // total_earnings
        0, // rating
        new Date(),
        new Date()
      ]);

      await client.query('COMMIT');
      return driverResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update driver availability
   */
  static async updateAvailability(driverId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      fields.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    });

    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    values.push(driverId);

    const sql = `
      UPDATE drivers
      SET ${fields.join(', ')}
      WHERE driver_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Get today's earnings
   */
  static async getTodayEarnings(driverId) {
    const sql = `
      SELECT COALESCE(SUM(driver_earnings), 0) as total
      FROM bookings
      WHERE driver_id = $1
      AND status = 'delivered'
      AND DATE(delivered_at) = CURRENT_DATE
    `;

    const result = await query(sql, [driverId]);
    return result.rows[0]?.total || 0;
  }

  /**
   * Get week's earnings
   */
  static async getWeekEarnings(driverId) {
    const sql = `
      SELECT COALESCE(SUM(driver_earnings), 0) as total
      FROM bookings
      WHERE driver_id = $1
      AND status = 'delivered'
      AND delivered_at >= CURRENT_DATE - INTERVAL '7 days'
    `;

    const result = await query(sql, [driverId]);
    return result.rows[0]?.total || 0;
  }

  /**
   * Get detailed earnings
   */
  static async getEarningsDetails(driverId, period = 'week') {
    let intervalClause = '';
    switch (period) {
      case 'day':
        intervalClause = "AND delivered_at >= CURRENT_DATE";
        break;
      case 'week':
        intervalClause = "AND delivered_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        intervalClause = "AND delivered_at >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      default:
        intervalClause = "AND delivered_at >= CURRENT_DATE - INTERVAL '7 days'";
    }

    const sql = `
      SELECT
        COUNT(*) as trip_count,
        COALESCE(SUM(driver_earnings), 0) as total,
        COALESCE(AVG(driver_earnings), 0) as average,
        COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN driver_earnings ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN payment_status = 'processed' THEN driver_earnings ELSE 0 END), 0) as processed_amount,
        DATE(delivered_at) as date,
        COUNT(*) as trips_per_day,
        SUM(driver_earnings) as earnings_per_day
      FROM bookings
      WHERE driver_id = $1
      AND status = 'delivered'
      ${intervalClause}
      GROUP BY DATE(delivered_at)
      ORDER BY date DESC
    `;

    const result = await query(sql, [driverId]);

    const summary = result.rows[0] || {};
    const breakdown = result.rows.map(row => ({
      date: row.date,
      trips: row.trips_per_day,
      earnings: row.earnings_per_day
    }));

    return {
      total: summary.total || 0,
      tripCount: summary.trip_count || 0,
      average: summary.average || 0,
      pendingAmount: summary.pending_amount || 0,
      processedAmount: summary.processed_amount || 0,
      breakdown,
      nextPayoutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Weekly payouts
    };
  }

  /**
   * Update driver earnings
   */
  static async updateEarnings(driverId, amount) {
    const sql = `
      UPDATE drivers
      SET total_earnings = total_earnings + $1,
          updated_at = NOW()
      WHERE driver_id = $2
      RETURNING total_earnings
    `;

    const result = await query(sql, [amount, driverId]);
    return result.rows[0];
  }

  /**
   * Log trip rejection
   */
  static async logTripRejection(data) {
    const sql = `
      INSERT INTO driver_trip_rejections (
        driver_id, booking_id, reason, rejected_at
      ) VALUES ($1, $2, $3, $4)
    `;

    // This table would need to be created in production
    try {
      await query(sql, [
        data.driver_id,
        data.booking_id,
        data.reason,
        data.rejected_at
      ]);
    } catch (error) {
      console.log('Trip rejection logging failed (table may not exist):', error.message);
    }
  }

  /**
   * Get available drivers for a location
   */
  static async getAvailableDrivers(criteria) {
    const { latitude, longitude, vehicleType, radius = 10 } = criteria;

    // Using Haversine formula for distance calculation
    const sql = `
      SELECT
        d.*,
        (6371 * acos(
          cos(radians($1)) * cos(radians(last_location_lat)) *
          cos(radians(last_location_lng) - radians($2)) +
          sin(radians($1)) * sin(radians(last_location_lat))
        )) AS distance_km
      FROM drivers d
      WHERE d.is_available = true
      AND d.is_online = true
      AND d.vehicle_type = $3
      AND d.status = 'active'
      HAVING distance_km <= $4
      ORDER BY distance_km
      LIMIT 10
    `;

    const result = await query(sql, [latitude, longitude, vehicleType, radius]);
    return result.rows;
  }

  /**
   * Update driver location
   */
  static async updateLocation(driverId, latitude, longitude) {
    const sql = `
      UPDATE drivers
      SET last_location_lat = $1,
          last_location_lng = $2,
          last_location_update = NOW()
      WHERE driver_id = $3
    `;

    await query(sql, [latitude, longitude, driverId]);
  }

  /**
   * Get driver statistics
   */
  static async getStatistics(driverId) {
    const sql = `
      SELECT
        d.total_trips,
        d.total_earnings,
        d.rating,
        COUNT(DISTINCT DATE(b.delivered_at)) as days_worked,
        AVG(b.actual_distance_km) as avg_distance_per_trip,
        SUM(b.actual_distance_km) as total_distance,
        COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_trips,
        COUNT(CASE WHEN b.rating >= 4 THEN 1 END) as good_ratings
      FROM drivers d
      LEFT JOIN bookings b ON d.driver_id = b.driver_id
      WHERE d.driver_id = $1
      GROUP BY d.driver_id, d.total_trips, d.total_earnings, d.rating
    `;

    const result = await query(sql, [driverId]);
    return result.rows[0] || {};
  }
}

module.exports = DriverModel;