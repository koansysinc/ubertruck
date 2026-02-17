/**
 * Fleet Model
 * Handles all database operations for trucks and fleet management
 */

const { query, transaction } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class FleetModel {
  /**
   * Add new truck
   */
  static async addTruck(carrierId, truckData) {
    const sql = `
      INSERT INTO trucks (
        carrier_id, vehicle_number, truck_type, capacity_tonnes,
        make, model, year_of_manufacture, insurance_expiry,
        fitness_expiry, puc_expiry, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const capacityMap = {
      '10T': 10,
      '15T': 15,
      '20T': 20
    };

    const params = [
      carrierId,
      truckData.vehicleNumber.toUpperCase(),
      truckData.truckType,
      capacityMap[truckData.truckType],
      truckData.make,
      truckData.model,
      truckData.yearOfManufacture,
      truckData.insuranceExpiry,
      truckData.fitnessExpiry,
      truckData.pucExpiry,
      'available'
    ];

    const result = await query(sql, params);
    return result.rows[0];
  }

  /**
   * Get all trucks for a carrier
   */
  static async getCarrierTrucks(carrierId) {
    const sql = `
      SELECT
        t.*,
        d.full_name as driver_name,
        d.license_number,
        CASE
          WHEN t.status = 'available' THEN true
          ELSE false
        END as is_available
      FROM trucks t
      LEFT JOIN drivers d ON t.driver_id = d.driver_id
      WHERE t.carrier_id = $1
      ORDER BY t.created_at DESC
    `;

    const result = await query(sql, [carrierId]);
    return result.rows;
  }

  /**
   * Get truck by ID
   */
  static async getTruckById(truckId) {
    const sql = `
      SELECT
        t.*,
        c.company_name as carrier_name,
        c.owner_name,
        d.full_name as driver_name,
        d.license_number,
        d.emergency_contact
      FROM trucks t
      JOIN carriers c ON t.carrier_id = c.carrier_id
      LEFT JOIN drivers d ON t.driver_id = d.driver_id
      WHERE t.truck_id = $1
    `;

    const result = await query(sql, [truckId]);
    return result.rows[0];
  }

  /**
   * Update truck status
   */
  static async updateTruckStatus(truckId, status) {
    const sql = `
      UPDATE trucks
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE truck_id = $1
      RETURNING *
    `;

    const result = await query(sql, [truckId, status]);
    return result.rows[0];
  }

  /**
   * Assign driver to truck
   */
  static async assignDriver(truckId, driverId) {
    return await transaction(async (client) => {
      // Remove driver from any other truck
      await client.query(
        'UPDATE trucks SET driver_id = NULL WHERE driver_id = $1 AND truck_id != $2',
        [driverId, truckId]
      );

      // Assign driver to this truck
      const result = await client.query(
        `UPDATE trucks
         SET driver_id = $2, updated_at = CURRENT_TIMESTAMP
         WHERE truck_id = $1
         RETURNING *`,
        [truckId, driverId]
      );

      return result.rows[0];
    });
  }

  /**
   * Get available trucks
   */
  static async getAvailableTrucks(truckType = null) {
    let sql = `
      SELECT
        t.*,
        c.company_name as carrier_name,
        d.full_name as driver_name
      FROM trucks t
      JOIN carriers c ON t.carrier_id = c.carrier_id
      LEFT JOIN drivers d ON t.driver_id = d.driver_id
      WHERE t.status = 'available'
    `;

    const params = [];
    if (truckType) {
      sql += ' AND t.truck_type = $1';
      params.push(truckType);
    }

    sql += ' ORDER BY t.created_at';

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Update truck location
   */
  static async updateTruckLocation(truckId, lat, lng) {
    const sql = `
      UPDATE trucks
      SET
        current_location_lat = $2,
        current_location_lng = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE truck_id = $1
      RETURNING *
    `;

    const result = await query(sql, [truckId, lat, lng]);
    return result.rows[0];
  }

  /**
   * Check truck availability for date range
   */
  static async checkAvailability(truckId, startDate, endDate) {
    const sql = `
      SELECT COUNT(*) as booking_count
      FROM bookings
      WHERE truck_id = $1
        AND status NOT IN ('cancelled', 'delivered')
        AND pickup_date BETWEEN $2 AND $3
    `;

    const result = await query(sql, [truckId, startDate, endDate]);
    return parseInt(result.rows[0].booking_count) === 0;
  }

  /**
   * Get truck statistics
   */
  static async getTruckStats(truckId) {
    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'delivered') as completed_trips,
        COUNT(*) FILTER (WHERE status IN ('assigned', 'picked_up', 'in_transit')) as active_trips,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_trips,
        SUM(distance_km) FILTER (WHERE status = 'delivered') as total_distance,
        SUM(cargo_weight_tonnes) FILTER (WHERE status = 'delivered') as total_tonnage,
        AVG(EXTRACT(EPOCH FROM (actual_delivery_time - actual_pickup_time))/3600)
          FILTER (WHERE status = 'delivered') as avg_trip_hours
      FROM bookings
      WHERE truck_id = $1
    `;

    const result = await query(sql, [truckId]);
    return result.rows[0];
  }

  /**
   * Update truck details
   */
  static async updateTruck(truckId, updates) {
    const allowedFields = [
      'insurance_expiry', 'fitness_expiry', 'puc_expiry',
      'make', 'model', 'year_of_manufacture'
    ];

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

    values.push(truckId);
    const sql = `
      UPDATE trucks
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE truck_id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Delete truck (soft delete by setting status to inactive)
   */
  static async deleteTruck(truckId) {
    const sql = `
      UPDATE trucks
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE truck_id = $1
      RETURNING *
    `;

    const result = await query(sql, [truckId]);
    return result.rows[0];
  }

  /**
   * Get fleet summary for carrier
   */
  static async getFleetSummary(carrierId) {
    const sql = `
      SELECT
        COUNT(*) as total_trucks,
        COUNT(*) FILTER (WHERE status = 'available') as available_trucks,
        COUNT(*) FILTER (WHERE status = 'in_transit') as in_transit_trucks,
        COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_trucks,
        COUNT(*) FILTER (WHERE truck_type = '10T') as trucks_10t,
        COUNT(*) FILTER (WHERE truck_type = '15T') as trucks_15t,
        COUNT(*) FILTER (WHERE truck_type = '20T') as trucks_20t,
        COUNT(DISTINCT driver_id) as total_drivers
      FROM trucks
      WHERE carrier_id = $1
    `;

    const result = await query(sql, [carrierId]);
    return result.rows[0];
  }
}

module.exports = FleetModel;