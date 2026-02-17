-- Drop existing tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS driver_trip_rejections CASCADE;
DROP TABLE IF EXISTS driver_earnings CASCADE;
DROP TABLE IF EXISTS driver_documents CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;

-- Create Drivers Table for UberTruck MVP
-- Following Uber/Rapido patterns for Indian logistics

-- Create drivers table with proper schema
CREATE TABLE drivers (
    driver_id VARCHAR(100) PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,

    -- Personal Information (KYC)
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    license_expiry DATE,
    aadhar_number VARCHAR(12) UNIQUE,
    pan_number VARCHAR(10) UNIQUE,

    -- Vehicle Information
    vehicle_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type VARCHAR(10) NOT NULL CHECK (vehicle_type IN ('10T', '15T', '20T')),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,

    -- Bank Details (for payments)
    bank_account_number VARCHAR(20),
    bank_ifsc VARCHAR(11),
    bank_account_name VARCHAR(255),

    -- Status and Availability
    status VARCHAR(30) DEFAULT 'pending_verification'
        CHECK (status IN ('pending_verification', 'active', 'suspended', 'inactive')),
    is_available BOOLEAN DEFAULT false,
    is_online BOOLEAN DEFAULT false,
    current_booking_id VARCHAR(100),

    -- Location Tracking
    last_location_lat DECIMAL(10, 8),
    last_location_lng DECIMAL(11, 8),
    last_location_update TIMESTAMP,

    -- Performance Metrics
    total_trips INTEGER DEFAULT 0,
    total_earnings DECIMAL(12, 2) DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_ratings INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    last_active_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_drivers_phone ON drivers(phone_number);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_availability ON drivers(is_available, is_online);
CREATE INDEX idx_drivers_location ON drivers(last_location_lat, last_location_lng);
CREATE INDEX idx_drivers_vehicle_type ON drivers(vehicle_type);

-- Create driver documents table for KYC document storage
CREATE TABLE driver_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id VARCHAR(100) REFERENCES drivers(driver_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL
        CHECK (document_type IN ('license', 'aadhar', 'pan', 'vehicle_rc', 'insurance', 'permit')),
    document_url TEXT NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verified_by UUID REFERENCES users(user_id),
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(driver_id, document_type)
);

-- Create driver earnings table for detailed earnings tracking
CREATE TABLE driver_earnings (
    earning_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id VARCHAR(100) REFERENCES drivers(driver_id) ON DELETE CASCADE,
    booking_id VARCHAR(100) REFERENCES bookings(booking_id),

    -- Earnings breakdown
    base_amount DECIMAL(10, 2) NOT NULL,
    surge_amount DECIMAL(10, 2) DEFAULT 0,
    incentive_amount DECIMAL(10, 2) DEFAULT 0,
    deductions DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,

    -- Payment status
    payment_status VARCHAR(20) DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'processed', 'paid', 'failed')),
    payment_date TIMESTAMP,
    payment_reference VARCHAR(100),

    -- Trip details
    distance_km DECIMAL(8, 2),
    duration_minutes INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create driver trip rejections table for analytics
CREATE TABLE driver_trip_rejections (
    rejection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id VARCHAR(100) REFERENCES drivers(driver_id) ON DELETE CASCADE,
    booking_id VARCHAR(100),
    reason TEXT,
    rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add driver fields to bookings table if not exists
DO $$
BEGIN
    -- Add driver_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'driver_id'
    ) THEN
        ALTER TABLE bookings ADD COLUMN driver_id VARCHAR(100) REFERENCES drivers(driver_id);
    END IF;

    -- Add driver_name if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'driver_name'
    ) THEN
        ALTER TABLE bookings ADD COLUMN driver_name VARCHAR(255);
    END IF;

    -- Add driver_phone if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'driver_phone'
    ) THEN
        ALTER TABLE bookings ADD COLUMN driver_phone VARCHAR(15);
    END IF;

    -- Add vehicle_number if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'vehicle_number'
    ) THEN
        ALTER TABLE bookings ADD COLUMN vehicle_number VARCHAR(20);
    END IF;

    -- Add driver_earnings if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'driver_earnings'
    ) THEN
        ALTER TABLE bookings ADD COLUMN driver_earnings DECIMAL(10, 2);
    END IF;

    -- Add assigned_at if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'assigned_at'
    ) THEN
        ALTER TABLE bookings ADD COLUMN assigned_at TIMESTAMP;
    END IF;

    -- Add picked_up_at if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'picked_up_at'
    ) THEN
        ALTER TABLE bookings ADD COLUMN picked_up_at TIMESTAMP;
    END IF;

    -- Add delivered_at if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'delivered_at'
    ) THEN
        ALTER TABLE bookings ADD COLUMN delivered_at TIMESTAMP;
    END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for drivers table
DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample drivers for testing (following Indian logistics patterns)
INSERT INTO drivers (
    driver_id,
    full_name,
    phone_number,
    license_number,
    vehicle_number,
    vehicle_type,
    aadhar_number,
    pan_number,
    bank_account_number,
    bank_ifsc,
    bank_account_name,
    status,
    is_available,
    is_online,
    last_location_lat,
    last_location_lng,
    rating
) VALUES
(
    'driver-1771050000-demo1',
    'Rajesh Kumar',
    '9876543210',
    'DL2020123456',
    'KA01AB1234',
    '10T',
    '123456789012',
    'ABCDE1234F',
    '1234567890',
    'HDFC0001234',
    'Rajesh Kumar',
    'active',
    true,
    false,
    17.3850,
    78.4867,
    4.5
),
(
    'driver-1771050000-demo2',
    'Suresh Reddy',
    '9876543211',
    'AP2021234567',
    'AP29BC5678',
    '15T',
    '234567890123',
    'FGHIJ5678K',
    '2345678901',
    'SBIN0005678',
    'Suresh Reddy',
    'active',
    true,
    false,
    17.4947,
    78.5366,
    4.3
),
(
    'driver-1771050000-demo3',
    'Mohammed Ali',
    '9876543212',
    'TS2022345678',
    'TS08CD9012',
    '20T',
    '345678901234',
    'KLMNO9012L',
    '3456789012',
    'ICIC0009012',
    'Mohammed Ali',
    'active',
    false,
    false,
    17.2473,
    78.5822,
    4.7
),
(
    'driver-1771050000-demo4',
    'Ramesh Kumar Singh',
    '9876543213',
    'DL2024567890',
    'KA05MN1234',
    '15T',
    '987654321098',
    'BXPRS1234D',
    '9876543210',
    'SBIN0001234',
    'Ramesh Kumar Singh',
    'pending_verification',
    false,
    false,
    17.3850,
    78.4867,
    0
)
ON CONFLICT (phone_number) DO UPDATE
SET
    full_name = EXCLUDED.full_name,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- Grant necessary permissions
GRANT ALL ON drivers TO neondb_owner;
GRANT ALL ON driver_documents TO neondb_owner;
GRANT ALL ON driver_earnings TO neondb_owner;
GRANT ALL ON driver_trip_rejections TO neondb_owner;

-- Success message
SELECT 'Driver tables recreated successfully with Indian logistics KYC requirements' as status;