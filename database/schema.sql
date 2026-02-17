-- UberTruck MVP Database Schema
-- PostgreSQL schema for Neon DB

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS trucks CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS otp_sessions CASCADE;
DROP TABLE IF EXISTS price_calculations CASCADE;

-- Users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('shipper', 'carrier', 'driver', 'admin')),
    business_name VARCHAR(255),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    address TEXT,
    pincode VARCHAR(6),
    gst_number VARCHAR(15),
    pan_number VARCHAR(10),
    is_active BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    shipper_id UUID,
    carrier_id UUID,
    driver_id UUID
);

-- OTP Sessions table
CREATE TABLE otp_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    attempts INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trucks table
CREATE TABLE trucks (
    truck_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID REFERENCES users(user_id),
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(10) NOT NULL CHECK (vehicle_type IN ('10T', '15T', '20T')),
    capacity_tonnes INTEGER NOT NULL,
    driver_id UUID REFERENCES users(user_id),
    is_available BOOLEAN DEFAULT true,
    current_location_lat DECIMAL(10, 8),
    current_location_lng DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Price Calculations table
CREATE TABLE price_calculations (
    calculation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pickup_pincode VARCHAR(6) NOT NULL,
    delivery_pincode VARCHAR(6) NOT NULL,
    distance DECIMAL(10, 2) NOT NULL,
    weight DECIMAL(10, 2) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    cgst_amount DECIMAL(10, 2) NOT NULL,
    sgst_amount DECIMAL(10, 2) NOT NULL,
    igst_amount DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE bookings (
    booking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(20) UNIQUE NOT NULL,
    shipper_id UUID REFERENCES users(user_id),
    carrier_id UUID REFERENCES users(user_id),
    driver_id UUID REFERENCES users(user_id),
    truck_id UUID REFERENCES trucks(truck_id),
    calculation_id UUID REFERENCES price_calculations(calculation_id),

    -- Location details
    pickup_location TEXT NOT NULL,
    pickup_address TEXT,
    pickup_pincode VARCHAR(6),
    pickup_lat DECIMAL(10, 8) NOT NULL,
    pickup_lng DECIMAL(11, 8) NOT NULL,

    delivery_location TEXT NOT NULL,
    delivery_address TEXT,
    delivery_pincode VARCHAR(6),
    delivery_lat DECIMAL(10, 8) NOT NULL,
    delivery_lng DECIMAL(11, 8) NOT NULL,

    -- Cargo details
    cargo_type VARCHAR(100) NOT NULL,
    cargo_weight DECIMAL(10, 2) NOT NULL,
    cargo_description TEXT,
    special_instructions TEXT,

    -- Schedule
    pickup_date TIMESTAMP NOT NULL,
    estimated_delivery_date TIMESTAMP,
    actual_pickup_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,

    -- Pricing
    distance DECIMAL(10, 2) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    gst_amount DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'created' CHECK (status IN (
        'created', 'confirmed', 'assigned', 'pickup_started',
        'in_transit', 'delivered', 'completed', 'cancelled'
    )),

    -- Contact details
    pickup_contact JSONB,
    delivery_contact JSONB,

    -- POD (Proof of Delivery)
    pod_url TEXT,
    pod_uploaded_at TIMESTAMP,

    -- Tracking
    tracking_updates JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT
);

-- Indexes for better performance
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_bookings_shipper ON bookings(shipper_id);
CREATE INDEX idx_bookings_carrier ON bookings(carrier_id);
CREATE INDEX idx_bookings_driver ON bookings(driver_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_pickup_date ON bookings(pickup_date);
CREATE INDEX idx_trucks_available ON trucks(is_available);
CREATE INDEX idx_otp_sessions_phone ON otp_sessions(phone_number);
CREATE INDEX idx_otp_sessions_expires ON otp_sessions(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trucks_updated_at BEFORE UPDATE ON trucks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial test data
INSERT INTO users (phone_number, role, business_name, is_active, is_verified) VALUES
    ('9999999999', 'admin', 'UberTruck Admin', true, true),
    ('9876543210', 'carrier', 'Demo Carrier Co', true, true),
    ('9876543211', 'driver', 'Demo Driver', true, true);

INSERT INTO trucks (carrier_id, vehicle_number, vehicle_type, capacity_tonnes, driver_id) VALUES
    ((SELECT user_id FROM users WHERE phone_number = '9876543210'), 'TG-01-AB-1234', '10T', 10,
     (SELECT user_id FROM users WHERE phone_number = '9876543211'));

-- Grant permissions (adjust as needed for your database user)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO neondb_owner;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO neondb_owner;