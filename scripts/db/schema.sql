-- UberTruck MVP Database Schema
-- PostgreSQL 15
-- Version: 1.0.0-FROZEN

-- Drop existing tables if they exist
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS booking_status_history CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS truck_availability CASCADE;
DROP TABLE IF EXISTS trucks CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS carriers CASCADE;
DROP TABLE IF EXISTS shippers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('shipper', 'carrier', 'driver', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE truck_type AS ENUM ('10T', '15T', '20T');
CREATE TYPE truck_status AS ENUM ('available', 'in_transit', 'maintenance', 'inactive');
CREATE TYPE booking_status AS ENUM ('created', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Users table (base authentication)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(10) UNIQUE NOT NULL CHECK (phone_number ~ '^[0-9]{10}$'),
    role user_role NOT NULL,
    status user_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    CONSTRAINT valid_phone CHECK (phone_number ~ '^[6-9][0-9]{9}$')
);

-- Shippers table
CREATE TABLE shippers (
    shipper_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    gst_number VARCHAR(15) CHECK (gst_number ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$'),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100) DEFAULT 'Nalgonda',
    state VARCHAR(100) DEFAULT 'Telangana',
    pincode VARCHAR(6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Carriers table
CREATE TABLE carriers (
    carrier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    gst_number VARCHAR(15),
    pan_number VARCHAR(10),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100) DEFAULT 'Nalgonda',
    state VARCHAR(100) DEFAULT 'Telangana',
    pincode VARCHAR(6),
    fleet_size INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table
CREATE TABLE drivers (
    driver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    carrier_id UUID REFERENCES carriers(carrier_id),
    full_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(20) NOT NULL UNIQUE,
    license_expiry DATE NOT NULL,
    aadhar_number VARCHAR(12),
    address TEXT,
    emergency_contact VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trucks table
CREATE TABLE trucks (
    truck_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id UUID NOT NULL REFERENCES carriers(carrier_id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(driver_id),
    vehicle_number VARCHAR(20) NOT NULL UNIQUE,
    truck_type truck_type NOT NULL,
    capacity_tonnes INTEGER NOT NULL CHECK (capacity_tonnes IN (10, 15, 20)),
    make VARCHAR(100),
    model VARCHAR(100),
    year_of_manufacture INTEGER,
    insurance_expiry DATE,
    fitness_expiry DATE,
    puc_expiry DATE,
    status truck_status DEFAULT 'available',
    current_location_lat DECIMAL(10, 7),
    current_location_lng DECIMAL(10, 7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Truck availability table
CREATE TABLE truck_availability (
    availability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truck_id UUID NOT NULL REFERENCES trucks(truck_id) ON DELETE CASCADE,
    available_from TIMESTAMP NOT NULL,
    available_to TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_availability CHECK (available_to > available_from)
);

-- Bookings table
CREATE TABLE bookings (
    booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number VARCHAR(20) UNIQUE NOT NULL,
    shipper_id UUID NOT NULL REFERENCES shippers(shipper_id),
    truck_id UUID REFERENCES trucks(truck_id),
    driver_id UUID REFERENCES drivers(driver_id),

    -- Location details
    pickup_location VARCHAR(255) NOT NULL,
    pickup_lat DECIMAL(10, 7) NOT NULL,
    pickup_lng DECIMAL(10, 7) NOT NULL,
    delivery_location VARCHAR(255) NOT NULL,
    delivery_lat DECIMAL(10, 7) NOT NULL,
    delivery_lng DECIMAL(10, 7) NOT NULL,

    -- Cargo details
    cargo_type VARCHAR(100) NOT NULL,
    cargo_weight_tonnes DECIMAL(5, 2) NOT NULL CHECK (cargo_weight_tonnes > 0 AND cargo_weight_tonnes <= 20),
    special_instructions TEXT,

    -- Schedule
    pickup_date DATE NOT NULL,
    estimated_delivery_date DATE,
    actual_pickup_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,

    -- Pricing (FROZEN at ₹5/tonne/km)
    distance_km DECIMAL(8, 2) NOT NULL CHECK (distance_km > 0),
    base_price DECIMAL(10, 2) NOT NULL,
    gst_amount DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,

    -- Status
    status booking_status DEFAULT 'created',
    pod_document VARCHAR(255),
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(user_id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints for Nalgonda-Miryalguda corridor
    CONSTRAINT valid_corridor CHECK (
        (pickup_lat BETWEEN 16.5 AND 17.5 AND pickup_lng BETWEEN 79.0 AND 80.0) AND
        (delivery_lat BETWEEN 16.5 AND 17.5 AND delivery_lng BETWEEN 79.0 AND 80.0)
    )
);

-- Booking status history
CREATE TABLE booking_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    status booking_status NOT NULL,
    changed_by UUID REFERENCES users(user_id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(booking_id),
    invoice_number VARCHAR(30) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    gst_amount DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'manual',
    payment_reference VARCHAR(255),
    payment_date TIMESTAMP,
    status payment_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_bookings_shipper ON bookings(shipper_id);
CREATE INDEX idx_bookings_truck ON bookings(truck_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(pickup_date);
CREATE INDEX idx_trucks_carrier ON trucks(carrier_id);
CREATE INDEX idx_trucks_status ON trucks(status);
CREATE INDEX idx_trucks_type ON trucks(truck_type);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shippers_updated_at BEFORE UPDATE ON shippers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carriers_updated_at BEFORE UPDATE ON carriers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trucks_updated_at BEFORE UPDATE ON trucks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate price (FROZEN at ₹5/tonne/km)
CREATE OR REPLACE FUNCTION calculate_booking_price(
    distance_km DECIMAL,
    weight_tonnes DECIMAL
) RETURNS TABLE (
    base_price DECIMAL,
    gst_amount DECIMAL,
    total_price DECIMAL
) AS $$
DECLARE
    rate_per_tonne_per_km CONSTANT DECIMAL := 5;  -- FROZEN rate
    gst_rate CONSTANT DECIMAL := 0.18;  -- 18% GST
    min_charge CONSTANT DECIMAL := 100;  -- Minimum charge
    base DECIMAL;
    gst DECIMAL;
    total DECIMAL;
BEGIN
    -- Calculate base price
    base := GREATEST(distance_km * weight_tonnes * rate_per_tonne_per_km, min_charge);

    -- Calculate GST
    gst := base * gst_rate;

    -- Calculate total
    total := base + gst;

    RETURN QUERY SELECT base, gst, total;
END;
$$ LANGUAGE plpgsql;

-- Insert default admin user
INSERT INTO users (phone_number, role, status)
VALUES ('9999999999', 'admin', 'active');

-- Grant permissions (adjust based on your PostgreSQL setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ubertruck_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ubertruck_user;