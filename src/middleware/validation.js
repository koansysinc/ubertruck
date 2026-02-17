/**
 * Validation Middleware
 * Input validation and sanitization
 */

const { body, param, query, validationResult } = require('express-validator');
const {
  validatePhoneNumber,
  validateGSTNumber,
  validatePANNumber,
  validateVehicleNumber,
  validateCorridorCoordinates
} = require('../utils/auth');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      }
    });
  }
  next();
};

/**
 * User validation rules
 */
const userValidation = {
  register: [
    body('phoneNumber')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .custom(validatePhoneNumber).withMessage('Invalid phone number format'),
    body('role')
      .trim()
      .notEmpty().withMessage('Role is required')
      .isIn(['shipper', 'carrier', 'driver']).withMessage('Invalid role'),
    handleValidationErrors
  ],

  login: [
    body('phoneNumber')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .custom(validatePhoneNumber).withMessage('Invalid phone number format'),
    handleValidationErrors
  ],

  verifyOTP: [
    body('phoneNumber')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .custom(validatePhoneNumber).withMessage('Invalid phone number format'),
    body('otp')
      .trim()
      .notEmpty().withMessage('OTP is required')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
      .isNumeric().withMessage('OTP must contain only numbers'),
    handleValidationErrors
  ],

  shipperProfile: [
    body('companyName')
      .trim()
      .notEmpty().withMessage('Company name is required')
      .isLength({ min: 3, max: 255 }).withMessage('Company name must be 3-255 characters'),
    body('gstNumber')
      .optional()
      .trim()
      .custom(validateGSTNumber).withMessage('Invalid GST number format'),
    body('contactPerson')
      .trim()
      .notEmpty().withMessage('Contact person is required'),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Invalid email format'),
    body('address')
      .trim()
      .notEmpty().withMessage('Address is required'),
    body('pincode')
      .optional()
      .trim()
      .isLength({ min: 6, max: 6 }).withMessage('Pincode must be 6 digits')
      .isNumeric().withMessage('Pincode must contain only numbers'),
    handleValidationErrors
  ],

  carrierProfile: [
    body('companyName')
      .trim()
      .notEmpty().withMessage('Company name is required'),
    body('ownerName')
      .trim()
      .notEmpty().withMessage('Owner name is required'),
    body('gstNumber')
      .optional()
      .trim()
      .custom(validateGSTNumber).withMessage('Invalid GST number format'),
    body('panNumber')
      .optional()
      .trim()
      .custom(validatePANNumber).withMessage('Invalid PAN number format'),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Invalid email format'),
    body('address')
      .trim()
      .notEmpty().withMessage('Address is required'),
    handleValidationErrors
  ],

  driverProfile: [
    body('fullName')
      .trim()
      .notEmpty().withMessage('Full name is required'),
    body('licenseNumber')
      .trim()
      .notEmpty().withMessage('License number is required'),
    body('licenseExpiry')
      .notEmpty().withMessage('License expiry date is required')
      .isISO8601().withMessage('Invalid date format'),
    body('aadharNumber')
      .optional()
      .trim()
      .isLength({ min: 12, max: 12 }).withMessage('Aadhar must be 12 digits')
      .isNumeric().withMessage('Aadhar must contain only numbers'),
    body('emergencyContact')
      .optional()
      .trim()
      .custom(validatePhoneNumber).withMessage('Invalid emergency contact number'),
    handleValidationErrors
  ]
};

/**
 * Booking validation rules
 */
const bookingValidation = {
  create: [
    body('pickupLocation')
      .trim()
      .notEmpty().withMessage('Pickup location is required'),
    body('pickupLat')
      .notEmpty().withMessage('Pickup latitude is required')
      .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude')
      .custom((value) => validateCorridorCoordinates(value, 79.5))
      .withMessage('Pickup location outside service corridor'),
    body('pickupLng')
      .notEmpty().withMessage('Pickup longitude is required')
      .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('deliveryLocation')
      .trim()
      .notEmpty().withMessage('Delivery location is required'),
    body('deliveryLat')
      .notEmpty().withMessage('Delivery latitude is required')
      .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude')
      .custom((value) => validateCorridorCoordinates(value, 79.5))
      .withMessage('Delivery location outside service corridor'),
    body('deliveryLng')
      .notEmpty().withMessage('Delivery longitude is required')
      .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('cargoType')
      .trim()
      .notEmpty().withMessage('Cargo type is required'),
    body('cargoWeight')
      .notEmpty().withMessage('Cargo weight is required')
      .isFloat({ min: 0.1, max: 20 }).withMessage('Weight must be between 0.1 and 20 tonnes'),
    body('pickupDate')
      .notEmpty().withMessage('Pickup date is required')
      .isISO8601().withMessage('Invalid date format')
      .custom((value) => {
        const pickupDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return pickupDate >= today;
      }).withMessage('Pickup date cannot be in the past'),
    handleValidationErrors
  ],

  updateStatus: [
    param('bookingId')
      .isUUID().withMessage('Invalid booking ID'),
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'])
      .withMessage('Invalid status'),
    body('notes')
      .optional()
      .trim(),
    handleValidationErrors
  ],

  cancel: [
    param('bookingId')
      .isUUID().withMessage('Invalid booking ID'),
    body('reason')
      .trim()
      .notEmpty().withMessage('Cancellation reason is required'),
    handleValidationErrors
  ],

  uploadPOD: [
    param('bookingId')
      .isUUID().withMessage('Invalid booking ID'),
    body('podUrl')
      .optional()
      .trim()
      .isURL().withMessage('Invalid POD URL'),
    body('podData')
      .optional()
      .trim(),
    body('notes')
      .optional()
      .trim(),
    handleValidationErrors
  ],

  assignTruck: [
    param('bookingId')
      .isUUID().withMessage('Invalid booking ID'),
    body('truckId')
      .notEmpty().withMessage('Truck ID is required')
      .isUUID().withMessage('Invalid truck ID'),
    body('driverId')
      .optional()
      .isUUID().withMessage('Invalid driver ID'),
    handleValidationErrors
  ]
};

/**
 * Fleet validation rules
 */
const fleetValidation = {
  addTruck: [
    body('vehicleNumber')
      .trim()
      .notEmpty().withMessage('Vehicle number is required')
      .custom(validateVehicleNumber).withMessage('Invalid vehicle number format'),
    body('truckType')
      .notEmpty().withMessage('Truck type is required')
      .isIn(['10T', '15T', '20T']).withMessage('Invalid truck type'),
    body('make')
      .optional()
      .trim(),
    body('model')
      .optional()
      .trim(),
    body('yearOfManufacture')
      .optional()
      .isInt({ min: 1990, max: new Date().getFullYear() })
      .withMessage('Invalid year of manufacture'),
    body('insuranceExpiry')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    body('fitnessExpiry')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    body('pucExpiry')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    handleValidationErrors
  ],

  updateTruck: [
    param('truckId')
      .isUUID().withMessage('Invalid truck ID'),
    body('status')
      .optional()
      .isIn(['available', 'in_transit', 'maintenance', 'inactive'])
      .withMessage('Invalid status'),
    handleValidationErrors
  ],

  assignDriver: [
    param('truckId')
      .isUUID().withMessage('Invalid truck ID'),
    body('driverId')
      .isUUID().withMessage('Invalid driver ID'),
    handleValidationErrors
  ]
};

/**
 * Common validation rules
 */
const commonValidation = {
  uuidParam: (paramName) => [
    param(paramName)
      .isUUID().withMessage(`Invalid ${paramName}`),
    handleValidationErrors
  ],

  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isIn(['created_at', 'updated_at', 'pickup_date', 'status'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    handleValidationErrors
  ],

  dateRange: [
    query('startDate')
      .optional()
      .isISO8601().withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601().withMessage('Invalid end date format')
      .custom((value, { req }) => {
        if (req.query.startDate && value) {
          return new Date(value) >= new Date(req.query.startDate);
        }
        return true;
      }).withMessage('End date must be after start date'),
    handleValidationErrors
  ]
};

/**
 * Driver validation rules
 */
const validateDriverRegistration = [
  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .custom(validatePhoneNumber).withMessage('Invalid phone number format'),
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required'),
  body('licenseNumber')
    .trim()
    .notEmpty().withMessage('License number is required'),
  body('vehicleNumber')
    .trim()
    .notEmpty().withMessage('Vehicle number is required'),
  body('vehicleType')
    .trim()
    .notEmpty().withMessage('Vehicle type is required')
    .isIn(['10T', '15T', '20T']).withMessage('Invalid vehicle type'),
  body('aadharNumber')
    .trim()
    .notEmpty().withMessage('Aadhar number is required')
    .isLength({ min: 12, max: 12 }).withMessage('Aadhar must be 12 digits'),
  body('panNumber')
    .trim()
    .notEmpty().withMessage('PAN number is required'),
  handleValidationErrors
];

const validateTripAction = [
  body('bookingId')
    .trim()
    .notEmpty().withMessage('Booking ID is required'),
  handleValidationErrors
];

module.exports = {
  userValidation,
  bookingValidation,
  fleetValidation,
  commonValidation,
  handleValidationErrors,
  validateDriverRegistration,
  validateTripAction
};