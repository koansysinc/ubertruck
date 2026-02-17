/**
 * User Model
 * Handles all database operations for users
 */

const { query, transaction } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class UserModel {
  /**
   * Find user by phone number
   */
  static async findByPhone(phoneNumber) {
    const sql = `
      SELECT
        u.*,
        s.shipper_id, s.company_name as shipper_company,
        c.carrier_id, c.company_name as carrier_company,
        d.driver_id, d.full_name as driver_name
      FROM users u
      LEFT JOIN shippers s ON u.user_id = s.user_id
      LEFT JOIN carriers c ON u.user_id = c.user_id
      LEFT JOIN drivers d ON u.user_id = d.user_id
      WHERE u.phone_number = $1
    `;

    const result = await query(sql, [phoneNumber]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  static async findById(userId) {
    const sql = `
      SELECT
        u.*,
        s.shipper_id, s.company_name as shipper_company, s.gst_number as shipper_gst,
        c.carrier_id, c.company_name as carrier_company, c.fleet_size,
        d.driver_id, d.full_name as driver_name, d.license_number
      FROM users u
      LEFT JOIN shippers s ON u.user_id = s.user_id
      LEFT JOIN carriers c ON u.user_id = c.user_id
      LEFT JOIN drivers d ON u.user_id = d.user_id
      WHERE u.user_id = $1
    `;

    const result = await query(sql, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Create new user
   */
  static async create(phoneNumber, role, businessName = null) {
    const userId = uuidv4();
    const sql = `
      INSERT INTO users (user_id, phone_number, role, business_name, is_active, is_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const result = await query(sql, [userId, phoneNumber, role, businessName, false, false]);
    return result.rows[0];
  }

  /**
   * Update user status
   */
  static async updateStatus(userId, isActive) {
    const sql = `
      UPDATE users
      SET is_active = $2, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await query(sql, [userId, isActive]);
    return result.rows[0];
  }

  /**
   * Update last login
   */
  static async updateLastLogin(userId) {
    const sql = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `;

    await query(sql, [userId]);
  }

  /**
   * Create shipper profile
   */
  static async createShipperProfile(userId, profileData) {
    return await transaction(async (client) => {
      // Update user status to active
      await client.query(
        'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [true, userId]
      );

      // Create shipper profile
      const sql = `
        INSERT INTO shippers (
          user_id, company_name, gst_number,
          contact_person, email, address, city, state, pincode
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await client.query(sql, [
        userId,
        profileData.companyName,
        profileData.gstNumber,
        profileData.contactPerson,
        profileData.email,
        profileData.address,
        profileData.city || 'Nalgonda',
        profileData.state || 'Telangana',
        profileData.pincode
      ]);

      return result.rows[0];
    });
  }

  /**
   * Create carrier profile
   */
  static async createCarrierProfile(userId, profileData) {
    return await transaction(async (client) => {
      // Update user status to active
      await client.query(
        'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [true, userId]
      );

      // Create carrier profile
      const sql = `
        INSERT INTO carriers (
          user_id, company_name, owner_name, gst_number,
          pan_number, email, address, city, state, pincode
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await client.query(sql, [
        userId,
        profileData.companyName,
        profileData.ownerName,
        profileData.gstNumber,
        profileData.panNumber,
        profileData.email,
        profileData.address,
        profileData.city || 'Nalgonda',
        profileData.state || 'Telangana',
        profileData.pincode
      ]);

      return result.rows[0];
    });
  }

  /**
   * Create driver profile
   */
  static async createDriverProfile(userId, profileData) {
    return await transaction(async (client) => {
      // Update user status to active
      await client.query(
        'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [true, userId]
      );

      // Create driver profile
      const sql = `
        INSERT INTO drivers (
          user_id, carrier_id, full_name, license_number,
          license_expiry, aadhar_number, address, emergency_contact
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await client.query(sql, [
        userId,
        profileData.carrierId,
        profileData.fullName,
        profileData.licenseNumber,
        profileData.licenseExpiry,
        profileData.aadharNumber,
        profileData.address,
        profileData.emergencyContact
      ]);

      return result.rows[0];
    });
  }

  /**
   * Update shipper profile
   */
  static async updateShipperProfile(shipperId, updates) {
    const allowedFields = ['company_name', 'gst_number', 'contact_person',
                          'email', 'address', 'city', 'state', 'pincode'];

    const setClause = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (setClause.length === 0) return null;

    values.push(shipperId);
    const sql = `
      UPDATE shippers
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE shipper_id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId, role) {
    let stats = {};

    if (role === 'shipper') {
      const sql = `
        SELECT
          COUNT(*) FILTER (WHERE status = 'delivered') as completed_bookings,
          COUNT(*) FILTER (WHERE status IN ('created', 'assigned', 'picked_up', 'in_transit')) as active_bookings,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
          SUM(total_price) FILTER (WHERE status = 'delivered') as total_spent
        FROM bookings b
        JOIN shippers s ON b.shipper_id = s.shipper_id
        WHERE s.user_id = $1
      `;

      const result = await query(sql, [userId]);
      stats = result.rows[0];
    } else if (role === 'carrier') {
      const sql = `
        SELECT
          COUNT(DISTINCT t.truck_id) as total_trucks,
          COUNT(DISTINCT t.truck_id) FILTER (WHERE t.status = 'available') as available_trucks,
          COUNT(DISTINCT b.booking_id) FILTER (WHERE b.status = 'delivered') as completed_trips,
          SUM(b.total_price) FILTER (WHERE b.status = 'delivered') as total_earnings
        FROM carriers c
        LEFT JOIN trucks t ON c.carrier_id = t.carrier_id
        LEFT JOIN bookings b ON t.truck_id = b.truck_id
        WHERE c.user_id = $1
        GROUP BY c.carrier_id
      `;

      const result = await query(sql, [userId]);
      stats = result.rows[0] || {
        total_trucks: 0,
        available_trucks: 0,
        completed_trips: 0,
        total_earnings: 0
      };
    } else if (role === 'driver') {
      const sql = `
        SELECT
          COUNT(*) FILTER (WHERE status = 'delivered') as completed_trips,
          COUNT(*) FILTER (WHERE status IN ('assigned', 'picked_up', 'in_transit')) as active_trips,
          COUNT(*) FILTER (WHERE pickup_date = CURRENT_DATE) as today_trips
        FROM bookings b
        JOIN drivers d ON b.driver_id = d.driver_id
        WHERE d.user_id = $1
      `;

      const result = await query(sql, [userId]);
      stats = result.rows[0];
    }

    return stats;
  }

  /**
   * Check if phone number exists
   */
  static async phoneExists(phoneNumber) {
    const sql = 'SELECT COUNT(*) as count FROM users WHERE phone_number = $1';
    const result = await query(sql, [phoneNumber]);
    return parseInt(result.rows[0].count) > 0;
  }
}

module.exports = UserModel;