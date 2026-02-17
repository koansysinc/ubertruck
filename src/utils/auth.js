/**
 * Authentication Utilities
 * JWT token management and OTP generation
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate 6-digit OTP
 */
function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

/**
 * Generate JWT token
 */
function generateToken(payload) {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const expiry = process.env.JWT_EXPIRY || '24h';

  return jwt.sign(payload, secret, {
    expiresIn: expiry,
    issuer: 'ubertruck-mvp'
  });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'your-secret-key';

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

/**
 * Generate booking number
 */
function generateBookingNumber() {
  const prefix = 'BK';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/**
 * Generate invoice number
 */
function generateInvoiceNumber() {
  const prefix = 'INV';
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}${year}${month}${random}`;
}

/**
 * Normalize phone number
 * Strips +91 prefix if present
 * @param {string} phone - Phone number with or without +91 prefix
 * @returns {string} - 10-digit phone number
 */
function normalizePhoneNumber(phone) {
  if (!phone) return phone;
  return phone.replace(/^\+91/, '');
}

/**
 * Validate Indian phone number
 * Accepts both formats:
 * - 10 digits: 9876543210
 * - With +91 prefix: +919876543210
 */
function validatePhoneNumber(phone) {
  // Strip +91 prefix if present
  const cleanPhone = normalizePhoneNumber(phone);
  // Indian mobile numbers start with 6-9 and have 10 digits
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * Validate GST number
 */
function validateGSTNumber(gst) {
  // GST format: 2 digits (state code) + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
  return gstRegex.test(gst);
}

/**
 * Validate PAN number
 */
function validatePANNumber(pan) {
  // PAN format: 5 letters + 4 digits + 1 letter
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
}

/**
 * Validate vehicle number
 */
function validateVehicleNumber(vehicleNumber) {
  // Indian vehicle number format: XX-00-XX-0000 or XX00XX0000
  const vehicleRegex = /^[A-Z]{2}[-]?[0-9]{2}[-]?[A-Z]{1,2}[-]?[0-9]{4}$/;
  return vehicleRegex.test(vehicleNumber.toUpperCase());
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Validate corridor coordinates
 */
function validateCorridorCoordinates(lat, lng) {
  // Nalgonda-Miryalguda corridor bounds
  const isValidLat = lat >= 16.5 && lat <= 17.5;
  const isValidLng = lng >= 79.0 && lng <= 80.0;
  return isValidLat && isValidLng;
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Calculate price (FROZEN at ₹5/tonne/km)
 */
function calculatePrice(distanceKm, weightTonnes) {
  const ratePerTonnePerKm = 5; // FROZEN rate
  const gstRate = 0.18; // 18% GST
  const minCharge = 100; // Minimum charge

  const basePrice = Math.max(distanceKm * weightTonnes * ratePerTonnePerKm, minCharge);
  const gstAmount = basePrice * gstRate;
  const totalPrice = basePrice + gstAmount;

  return {
    basePrice: Math.round(basePrice),
    gstAmount: Math.round(gstAmount),
    totalPrice: Math.round(totalPrice)
  };
}

/**
 * Validate booking window
 * Max 7 days advance, Min 1 hour before pickup
 */
function validateBookingWindow(pickupDateStr) {
  try {
    const pickupDate = new Date(pickupDateStr);
    const now = new Date();
    const maxAdvanceDays = 7;
    const minAdvanceHours = 1;

    // Check if date is valid
    if (isNaN(pickupDate.getTime())) {
      return {
        valid: false,
        message: 'Invalid pickup date'
      };
    }

    // Check if date is in the past (before min advance time)
    const minPickupTime = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);
    if (pickupDate < minPickupTime) {
      return {
        valid: false,
        message: `Pickup must be at least ${minAdvanceHours} hour(s) from now`
      };
    }

    // Check if date is too far in the future
    const maxPickupTime = new Date(now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000);
    if (pickupDate > maxPickupTime) {
      return {
        valid: false,
        message: `Pickup cannot be more than ${maxAdvanceDays} days in advance`
      };
    }

    return {
      valid: true,
      message: 'Valid booking window'
    };
  } catch (error) {
    return {
      valid: false,
      message: 'Invalid pickup date format'
    };
  }
}

module.exports = {
  generateOTP,
  generateToken,
  verifyToken,
  generateBookingNumber,
  generateInvoiceNumber,
  normalizePhoneNumber,
  validatePhoneNumber,
  validateGSTNumber,
  validatePANNumber,
  validateVehicleNumber,
  calculateDistance,
  validateCorridorCoordinates,
  formatCurrency,
  calculatePrice,
  validateBookingWindow
};