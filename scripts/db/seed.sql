-- UberTruck MVP Seed Data
-- Test data for development and testing

-- Clear existing data (in reverse order of dependencies)
DELETE FROM payments;
DELETE FROM booking_status_history;
DELETE FROM bookings;
DELETE FROM truck_availability;
DELETE FROM trucks;
DELETE FROM drivers;
DELETE FROM carriers;
DELETE FROM shippers;
DELETE FROM users WHERE phone_number != '9999999999'; -- Keep admin

-- Insert test users

-- Shippers
INSERT INTO users (user_id, phone_number, role, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', '9876543210', 'shipper', 'active'),
('550e8400-e29b-41d4-a716-446655440002', '9876543211', 'shipper', 'active'),
('550e8400-e29b-41d4-a716-446655440003', '9876543212', 'shipper', 'pending');

-- Carriers
INSERT INTO users (user_id, phone_number, role, status) VALUES
('550e8400-e29b-41d4-a716-446655440004', '9876543213', 'carrier', 'active'),
('550e8400-e29b-41d4-a716-446655440005', '9876543214', 'carrier', 'active');

-- Drivers
INSERT INTO users (user_id, phone_number, role, status) VALUES
('550e8400-e29b-41d4-a716-446655440006', '9876543215', 'driver', 'active'),
('550e8400-e29b-41d4-a716-446655440007', '9876543216', 'driver', 'active'),
('550e8400-e29b-41d4-a716-446655440008', '9876543217', 'driver', 'active');

-- Insert shipper profiles
INSERT INTO shippers (shipper_id, user_id, company_name, gst_number, contact_person, email, address, pincode) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001',
 'Nalgonda Stone Crushers', '36AABCN1234M1ZV', 'Rajesh Kumar', 'rajesh@nalgondastone.com',
 'Industrial Area, Nalgonda', '508001'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002',
 'Miryalguda Construction Co', '36AABCM5678N1ZX', 'Suresh Reddy', 'suresh@miryalgudaconst.com',
 'Main Road, Miryalguda', '508207');

-- Insert carrier profiles
INSERT INTO carriers (carrier_id, user_id, company_name, owner_name, gst_number, pan_number, email, address, fleet_size, pincode) VALUES
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004',
 'Telangana Logistics', 'Venkat Rao', '36AABTL9012P1ZY', 'AABTL9012P', 'venkat@telanganalogistics.com',
 'Transport Nagar, Nalgonda', 3, '508001'),
('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005',
 'Quick Transport Services', 'Mahesh Kumar', '36AABQT3456Q1ZZ', 'AABQT3456Q', 'mahesh@quicktransport.com',
 'Highway Road, Miryalguda', 2, '508207');

-- Insert driver profiles
INSERT INTO drivers (driver_id, user_id, carrier_id, full_name, license_number, license_expiry, aadhar_number, address, emergency_contact) VALUES
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006',
 '750e8400-e29b-41d4-a716-446655440001', 'Ravi Kumar', 'TS01920210001234', '2025-12-31',
 '123456789012', 'Driver Colony, Nalgonda', '9876543299'),
('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440007',
 '750e8400-e29b-41d4-a716-446655440001', 'Anil Sharma', 'TS01920210001235', '2026-06-30',
 '123456789013', 'Transport Area, Nalgonda', '9876543298'),
('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008',
 '750e8400-e29b-41d4-a716-446655440002', 'Kiran Reddy', 'TS01920210001236', '2025-09-30',
 '123456789014', 'Main Road, Miryalguda', '9876543297');

-- Insert trucks
INSERT INTO trucks (truck_id, carrier_id, driver_id, vehicle_number, truck_type, capacity_tonnes, make, model, year_of_manufacture, insurance_expiry, fitness_expiry, puc_expiry, status, current_location_lat, current_location_lng) VALUES
('950e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001',
 '850e8400-e29b-41d4-a716-446655440001', 'TS-08-AB-1234', '10T', 10,
 'Tata', 'LPT 1109', 2020, '2025-03-31', '2025-06-30', '2024-12-31', 'available', 17.0505, 79.2677),
('950e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001',
 '850e8400-e29b-41d4-a716-446655440002', 'TS-08-CD-5678', '15T', 15,
 'Ashok Leyland', 'Boss 1415', 2021, '2025-05-31', '2025-08-31', '2025-01-31', 'available', 17.0505, 79.2677),
('950e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001',
 NULL, 'TS-08-EF-9012', '20T', 20,
 'Volvo', 'FM 440', 2019, '2025-02-28', '2025-04-30', '2024-11-30', 'maintenance', 17.0505, 79.2677),
('950e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440002',
 '850e8400-e29b-41d4-a716-446655440003', 'TS-08-GH-3456', '10T', 10,
 'Tata', 'LPT 1109', 2022, '2025-07-31', '2025-10-31', '2025-03-31', 'available', 16.8764, 79.5625),
('950e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440002',
 NULL, 'TS-08-IJ-7890', '15T', 15,
 'Eicher', 'Pro 3015', 2021, '2025-04-30', '2025-07-31', '2025-02-28', 'available', 16.8764, 79.5625);

-- Insert truck availability
INSERT INTO truck_availability (truck_id, available_from, available_to) VALUES
('950e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days'),
('950e8400-e29b-41d4-a716-446655440002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days'),
('950e8400-e29b-41d4-a716-446655440004', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days'),
('950e8400-e29b-41d4-a716-446655440005', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days');

-- Insert sample bookings
-- Active booking (in_transit)
INSERT INTO bookings (
  booking_id, booking_number, shipper_id, truck_id, driver_id,
  pickup_location, pickup_lat, pickup_lng,
  delivery_location, delivery_lat, delivery_lng,
  cargo_type, cargo_weight_tonnes, special_instructions,
  pickup_date, estimated_delivery_date,
  distance_km, base_price, gst_amount, total_price,
  status, actual_pickup_time
) VALUES (
  'a50e8400-e29b-41d4-a716-446655440001', 'BK2024020001',
  '650e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001',
  'Nalgonda Stone Crushing Plant', 17.0505, 79.2677,
  'Construction Site, Miryalguda', 16.8764, 79.5625,
  'Construction Material - Stone Aggregates', 10, 'Handle with care, cover during rain',
  CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day',
  40, 2000, 360, 2360,
  'in_transit', CURRENT_TIMESTAMP - INTERVAL '2 hours'
);

-- Completed booking (delivered)
INSERT INTO bookings (
  booking_id, booking_number, shipper_id, truck_id, driver_id,
  pickup_location, pickup_lat, pickup_lng,
  delivery_location, delivery_lat, delivery_lng,
  cargo_type, cargo_weight_tonnes,
  pickup_date, estimated_delivery_date,
  distance_km, base_price, gst_amount, total_price,
  status, actual_pickup_time, actual_delivery_time, pod_document
) VALUES (
  'a50e8400-e29b-41d4-a716-446655440002', 'BK2024020002',
  '650e8400-e29b-41d4-a716-446655440002', '950e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440003',
  'Warehouse, Miryalguda', 16.8764, 79.5625,
  'Industrial Area, Nalgonda', 17.0505, 79.2677,
  'Iron Rods', 8,
  CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days',
  40, 1600, 288, 1888,
  'delivered', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '4 hours', 'pod_20240201_001.pdf'
);

-- Pending booking (created)
INSERT INTO bookings (
  booking_id, booking_number, shipper_id,
  pickup_location, pickup_lat, pickup_lng,
  delivery_location, delivery_lat, delivery_lng,
  cargo_type, cargo_weight_tonnes,
  pickup_date, estimated_delivery_date,
  distance_km, base_price, gst_amount, total_price,
  status
) VALUES (
  'a50e8400-e29b-41d4-a716-446655440003', 'BK2024020003',
  '650e8400-e29b-41d4-a716-446655440001',
  'Quarry Site, Nalgonda', 17.0200, 79.2500,
  'Building Site, Miryalguda', 16.9000, 79.5800,
  'Sand', 15,
  CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '1 day',
  42, 3150, 567, 3717,
  'created'
);

-- Insert booking status history
INSERT INTO booking_status_history (booking_id, status, changed_by, notes) VALUES
('a50e8400-e29b-41d4-a716-446655440001', 'created', '550e8400-e29b-41d4-a716-446655440001', 'Booking created'),
('a50e8400-e29b-41d4-a716-446655440001', 'assigned', NULL, 'Truck assigned automatically'),
('a50e8400-e29b-41d4-a716-446655440001', 'picked_up', '550e8400-e29b-41d4-a716-446655440006', 'Cargo loaded'),
('a50e8400-e29b-41d4-a716-446655440001', 'in_transit', '550e8400-e29b-41d4-a716-446655440006', 'On the way to delivery'),
('a50e8400-e29b-41d4-a716-446655440002', 'created', '550e8400-e29b-41d4-a716-446655440002', 'Booking created'),
('a50e8400-e29b-41d4-a716-446655440002', 'assigned', NULL, 'Truck assigned'),
('a50e8400-e29b-41d4-a716-446655440002', 'picked_up', '550e8400-e29b-41d4-a716-446655440008', 'Cargo loaded'),
('a50e8400-e29b-41d4-a716-446655440002', 'in_transit', '550e8400-e29b-41d4-a716-446655440008', 'In transit'),
('a50e8400-e29b-41d4-a716-446655440002', 'delivered', '550e8400-e29b-41d4-a716-446655440008', 'Delivered successfully');

-- Insert payments
INSERT INTO payments (
  booking_id, invoice_number, amount, gst_amount, total_amount,
  payment_method, payment_reference, payment_date, status
) VALUES (
  'a50e8400-e29b-41d4-a716-446655440002', 'INV202402001',
  1600, 288, 1888,
  'manual', 'NEFT/IMPS/202402/001234', CURRENT_DATE - INTERVAL '1 day', 'completed'
),
(
  'a50e8400-e29b-41d4-a716-446655440001', 'INV202402002',
  2000, 360, 2360,
  'manual', NULL, NULL, 'pending'
);

-- Display summary
SELECT 'Data seeding completed!' as status;
SELECT 'Users:' as entity, COUNT(*) as count FROM users
UNION ALL
SELECT 'Shippers:', COUNT(*) FROM shippers
UNION ALL
SELECT 'Carriers:', COUNT(*) FROM carriers
UNION ALL
SELECT 'Drivers:', COUNT(*) FROM drivers
UNION ALL
SELECT 'Trucks:', COUNT(*) FROM trucks
UNION ALL
SELECT 'Bookings:', COUNT(*) FROM bookings
UNION ALL
SELECT 'Payments:', COUNT(*) FROM payments;