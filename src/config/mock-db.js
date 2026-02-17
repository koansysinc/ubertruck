/**
 * Mock Database for Development/Testing
 * In-memory storage when PostgreSQL is not available
 */

class MockDatabase {
  constructor() {
    this.users = new Map();
    this.shippers = new Map();
    this.carriers = new Map();
    this.drivers = new Map();
    this.trucks = new Map();
    this.bookings = new Map();
    this.payments = new Map();

    // Add default admin user
    this.users.set('9999999999', {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      phone_number: '9999999999',
      role: 'admin',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });

    // Seed test drivers for Phase 1 testing
    const driver1 = {
      driver_id: 'driver-test-001',
      full_name: 'Rajesh Kumar',
      phone_number: '9876543210',
      license_number: 'TG-1234567890',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };
    const driver2 = {
      driver_id: 'driver-test-002',
      full_name: 'Suresh Reddy',
      phone_number: '9123456789',
      license_number: 'TG-0987654321',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };
    const driver3 = {
      driver_id: 'driver-test-003',
      full_name: 'Vijay Singh',
      phone_number: '9234567890',
      license_number: 'TG-1122334455',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };
    this.drivers.set('driver-test-001', driver1);
    this.drivers.set('driver-test-002', driver2);
    this.drivers.set('driver-test-003', driver3);

    // Seed test trucks for Phase 1 testing (one of each type: 10T, 15T, 20T)
    const truck1 = {
      truck_id: 'truck-test-001',
      vehicle_number: 'TG-01-AB-1234',
      truck_type: '10T',
      capacity_tonnes: 10,
      driver_id: 'driver-test-001',
      status: 'available',
      created_at: new Date(),
      updated_at: new Date()
    };
    const truck2 = {
      truck_id: 'truck-test-002',
      vehicle_number: 'TG-02-CD-5678',
      truck_type: '15T',
      capacity_tonnes: 15,
      driver_id: 'driver-test-002',
      status: 'available',
      created_at: new Date(),
      updated_at: new Date()
    };
    const truck3 = {
      truck_id: 'truck-test-003',
      vehicle_number: 'TG-03-EF-9012',
      truck_type: '20T',
      capacity_tonnes: 20,
      driver_id: 'driver-test-003',
      status: 'available',
      created_at: new Date(),
      updated_at: new Date()
    };
    this.trucks.set('truck-test-001', truck1);
    this.trucks.set('truck-test-002', truck2);
    this.trucks.set('truck-test-003', truck3);
  }

  async query(text, params) {
    console.log('Mock DB Query:', text.substring(0, 50));

    // Simple query parsing for basic operations
    if (text.includes('SELECT NOW()')) {
      return { rows: [{ now: new Date() }], rowCount: 1 };
    }

    if (text.includes('FROM users') && text.includes('WHERE')) {
      if (text.includes('phone_number')) {
        const phoneNumber = params[0];
        const user = this.users.get(phoneNumber);
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
      } else if (text.includes('user_id')) {
        const userId = params[0];
        for (let [phone, user] of this.users) {
          if (user.user_id === userId) {
            return { rows: [user], rowCount: 1 };
          }
        }
        return { rows: [], rowCount: 0 };
      }
    }

    if (text.includes('INSERT INTO users')) {
      const [phoneNumber, role] = params;
      const user = {
        user_id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        phone_number: phoneNumber,
        role: role,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      };
      this.users.set(phoneNumber, user);
      return { rows: [user], rowCount: 1 };
    }

    if (text.includes('UPDATE users')) {
      const [userId, status] = params;
      for (let [phone, user] of this.users) {
        if (user.user_id === userId) {
          user.status = status || user.status;
          user.updated_at = new Date();
          return { rows: [user], rowCount: 1 };
        }
      }
      return { rows: [], rowCount: 0 };
    }

    if (text.includes('INSERT INTO shippers')) {
      const shipperId = `shipper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const shipper = {
        shipper_id: shipperId,
        user_id: params[0],
        company_name: params[1],
        gst_number: params[2],
        address: params[3],
        created_at: new Date(),
        updated_at: new Date()
      };
      this.shippers.set(shipperId, shipper);

      // Update user reference
      for (let [phone, user] of this.users) {
        if (user.user_id === params[0]) {
          user.shipper_id = shipperId;
          user.shipper_company = params[1];
        }
      }

      return { rows: [shipper], rowCount: 1 };
    }

    if (text.includes('INSERT INTO bookings')) {
      const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const booking = {
        booking_id: bookingId,
        booking_number: params[0],
        shipper_id: params[1],
        pickup_location: params[2],
        pickup_lat: params[3],
        pickup_lng: params[4],
        delivery_location: params[5],
        delivery_lat: params[6],
        delivery_lng: params[7],
        cargo_type: params[8],
        cargo_weight_tonnes: params[9],
        special_instructions: params[10],
        pickup_date: params[11],
        estimated_delivery_date: params[12],
        distance_km: params[13],
        base_price: params[14],
        gst_amount: params[15],
        total_price: params[16],
        status: params[17],
        created_at: new Date(),
        updated_at: new Date()
      };
      this.bookings.set(bookingId, booking);
      return { rows: [booking], rowCount: 1 };
    }

    if (text.includes('INSERT INTO booking_status_history')) {
      // Just acknowledge it, don't need to store for MVP
      return { rows: [{}], rowCount: 1 };
    }

    if (text.includes('FROM trucks') && text.includes('WHERE status')) {
      // Find available trucks matching criteria
      const trucks = [];
      for (let [id, truck] of this.trucks) {
        if (truck.status === 'available') {
          // Check if capacity matches (if specified in params)
          if (params && params.length > 0) {
            const requiredCapacity = params[0];
            const requiredType = params[1];
            if (truck.capacity_tonnes >= requiredCapacity && truck.truck_type === requiredType) {
              trucks.push(truck);
            }
          } else {
            trucks.push(truck);
          }
        }
      }
      return { rows: trucks, rowCount: trucks.length };
    }

    if (text.includes('UPDATE bookings') && text.includes('SET truck_id')) {
      // Handle truck assignment to booking
      const [truckId, driverId, bookingId] = params;
      const booking = this.bookings.get(bookingId);

      if (!booking) {
        return { rows: [], rowCount: 0 };
      }

      booking.truck_id = truckId;
      booking.driver_id = driverId;
      booking.status = 'assigned';
      booking.updated_at = new Date();

      return { rows: [booking], rowCount: 1 };
    }

    if (text.includes('UPDATE trucks') && text.includes('SET status')) {
      // Handle truck status update
      const status = params[0];
      const truckId = params[1];
      const truck = this.trucks.get(truckId);

      if (!truck) {
        return { rows: [], rowCount: 0 };
      }

      truck.status = status;
      truck.updated_at = new Date();

      return { rows: [truck], rowCount: 1 };
    }

    if (text.includes('FROM bookings b') && text.includes('JOIN shippers') && text.includes('WHERE b.booking_id')) {
      // Handle getBookingById with JOINs
      const bookingId = params[0];
      const booking = this.bookings.get(bookingId);

      if (!booking) {
        return { rows: [], rowCount: 0 };
      }

      // Get shipper details
      let shipperCompany = null;
      for (let [id, shipper] of this.shippers) {
        if (shipper.shipper_id === booking.shipper_id) {
          shipperCompany = shipper.company_name;
          break;
        }
      }

      // Get truck and driver details if assigned
      let truckDetails = null;
      let driverDetails = null;

      if (booking.truck_id) {
        truckDetails = this.trucks.get(booking.truck_id);
        if (truckDetails && truckDetails.driver_id) {
          driverDetails = this.drivers.get(truckDetails.driver_id);
        }
      }

      // Build joined result
      const result = {
        ...booking,
        shipper_company: shipperCompany,
        vehicle_number: truckDetails ? truckDetails.vehicle_number : null,
        truck_type: truckDetails ? truckDetails.truck_type : null,
        driver_name: driverDetails ? driverDetails.full_name : null,
        driver_phone: driverDetails ? driverDetails.phone_number : null
      };

      return { rows: [result], rowCount: 1 };
    }

    // Default response
    return { rows: [], rowCount: 0 };
  }

  async getClient() {
    return {
      query: this.query.bind(this),
      release: () => {}
    };
  }

  async transaction(callback) {
    const client = await this.getClient();
    try {
      const result = await callback(client);
      return result;
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }
}

// Export as singleton
const mockDb = new MockDatabase();

module.exports = {
  pool: mockDb,
  query: mockDb.query.bind(mockDb),
  getClient: mockDb.getClient.bind(mockDb),
  transaction: mockDb.transaction.bind(mockDb),
  initializeDatabase: async () => {
    console.log('Mock database initialized (in-memory storage)');
    return true;
  }
};