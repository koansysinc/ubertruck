/**
 * UberTruck TypeScript Type Definitions
 * Central source for all shared types across frontend
 */

// ============================================================================
// Location & Address Types
// ============================================================================

export interface Location {
  lat: number;
  lng: number;
  latitude: number;
  longitude: number;
  address?: string;
  pincode: string;
  city?: string;
  state?: string;
  landmark?: string;
  plusCode?: string; // Google Plus Code
}

export interface ContactPerson {
  name: string;
  phone: string;
  phoneNumber: string;
  alternatePhone?: string;
}

// ============================================================================
// User Types
// ============================================================================

export type UserType = 'SHIPPER' | 'CARRIER' | 'DRIVER' | 'ADMIN';
export type UserVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface User {
  id: string;
  phoneNumber: string;
  businessName?: string;
  userType: UserType;
  verified: boolean;
  gstNumber?: string;
  address?: Location;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    verified: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthToken {
  token: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
  requestId: string;
}

// ============================================================================
// Cargo & Booking Types
// ============================================================================

export type CargoType = 'GENERAL' | 'FRAGILE' | 'HAZMAT' | 'PERISHABLE' | 'HEAVY' | 'AGRICULTURAL';
export type VehicleType = 'TRUCK' | 'MINI_TRUCK' | 'TRAILER' | 'CONTAINER';

export interface CargoDetails {
  type: CargoType;
  weight: number; // tonnes
  volume?: number; // cubic meters
  packages?: number;
  description: string;
  value?: number; // for insurance
  hsnCode?: string; // for E-Way Bill
}

export interface BookingRequest {
  pickupLocation: Location;
  deliveryLocation: Location;
  cargoDetails: CargoDetails;
  pickupTime: string; // ISO datetime
  pickupContact: ContactPerson;
  deliveryContact: ContactPerson;
  priceCalculationId?: string;
  invoiceDetails?: {
    invoiceNumber: string;
    invoiceDate: string;
    invoiceValue: number;
  };
  specialInstructions?: string;
}

export type BookingStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKUP_STARTED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  vehicleType: VehicleType;
  capacity: number; // tonnes
  make?: string;
  model?: string;
  year?: number;
  fitnessValidUpto?: string;
  permitValidUpto?: string;
  insuranceValidUpto?: string;
  gpsEnabled: boolean;
  currentLocation?: Location;
  vahanVerified: boolean;
  available?: boolean;
}

export interface Driver {
  id: string;
  name: string;
  phoneNumber: string;
  licenseNumber: string;
  licenseValidUpto?: string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  emergencyContact?: ContactPerson;
  sarathiVerified: boolean;
  available?: boolean;
  rating?: number;
  totalTrips?: number;
}

export interface BookingResponse {
  bookingId: string;
  bookingNumber: string;
  status: BookingStatus;
  pickupLocation: Location | string;
  deliveryLocation: Location | string;
  cargoDetails?: CargoDetails;
  cargoWeight?: number;
  distance?: number;
  pickupTime?: string;
  pickupDate?: string;
  pickupContact?: ContactPerson;
  deliveryContact?: ContactPerson;
  estimatedPrice?: number;
  basePrice?: number;
  gstAmount?: number;
  totalPrice?: number;
  priceCalculation?: PriceCalculation;
  truckAssigned?: boolean;
  // Driver and vehicle details (simplified from backend)
  driver?: {
    name: string;
    phone: string | null;
  };
  vehicle?: {
    registration: string | null;
    type: string | null; // '10T' | '15T' | '20T'
  };
  // Full assignment details (optional, for future use)
  assignedVehicle?: Vehicle;
  assignedDriver?: Driver;
  ewayBillNumber?: string;
  estimatedDeliveryTime?: string;
  createdAt?: string;
  updatedAt?: string;
  requestId?: string;
}

// ============================================================================
// Pricing Types
// ============================================================================

export interface GSTBreakdown {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface PriceCalculation {
  calculationId?: string;
  basePrice: number;
  fuelSurcharge: number;
  gst: GSTBreakdown;
  totalAmount: number;
  totalPrice?: number;
  distance?: number;
  cargoDetails?: CargoDetails;
  surcharges?: Array<{
    type: string;
    amount: number;
    description: string;
  }>;
  gstBreakdown?: {
    cgst: number;
    sgst: number;
    igst: number;
  };
  priceBreakdown?: {
    ratePerKm: number;
    ratePerTonne: number;
    minimumCharge: number;
  };
  validUntil: string;
  currency?: string;
  requestId?: string;
}

export interface Invoice {
  invoiceNumber: string;
  bookingId: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  gstDetails: {
    shipperGstin?: string;
    carrierGstin?: string;
    hsnCode?: string;
    cgst: number;
    sgst: number;
    igst: number;
  };
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE';
  pdfUrl?: string;
}

// ============================================================================
// Tracking Types
// ============================================================================

export type NetworkStatus = 'online' | 'offline';

export interface StatusUpdate {
  status: BookingStatus;
  timestamp: string;
  location?: Location;
  notes?: string;
  podImage?: string; // base64
  networkStatus: NetworkStatus;
}

export interface TrackingStatus {
  currentStatus: BookingStatus;
  statusHistory: StatusUpdate[];
  estimatedDelivery: string;
  lastUpdate: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: {
    field?: string;
    reason?: string;
    suggestion?: string;
  };
  timestamp: string;
  requestId: string;
  statusCode: number;
  downstream?: {
    service: string;
    error: string;
    statusCode: number;
  };
}

// ============================================================================
// UI State Types
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface FormErrors {
  [key: string]: string;
}

export interface FormState {
  values: Record<string, any>;
  errors: FormErrors;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number; // auto-dismiss after ms
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// Filter Types
// ============================================================================

export interface BookingFilters {
  status?: BookingStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface VehicleFilters {
  available?: boolean;
  page?: number;
  limit?: number;
}

export interface DriverFilters {
  available?: boolean;
  page?: number;
  limit?: number;
}
