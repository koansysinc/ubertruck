/**
 * Validation Utilities for UberTruck Registration
 *
 * Context Tracking & Guardrails:
 * - All validations follow frozen requirements (HARD CONSTRAINTS)
 * - Regex patterns match backend exactly (CONSISTENCY)
 * - Returns structured validation results with field-level errors
 * - No hardcoded magic numbers (GUARDRAIL)
 */

// ============================================================================
// Validation Rules (Frozen Requirements - NO MODIFICATION)
// ============================================================================

export const VALIDATION_RULES = {
  /**
   * Phone Number Validation
   * - Must be 10 digits
   * - Must start with 6-9 (Indian mobile)
   * - Accepts with/without +91 prefix
   */
  PHONE: {
    pattern: /^(\+91)?[6-9]\d{9}$/,
    message: 'Phone number must be 10 digits starting with 6-9',
    example: '9876543210 or +919876543210',
  },

  /**
   * Business Name Validation
   * - 3-100 characters
   * - Alphanumeric with spaces, hyphens, ampersands
   */
  BUSINESS_NAME: {
    pattern: /^[a-zA-Z0-9\s&-]{3,100}$/,
    minLength: 3,
    maxLength: 100,
    message: 'Business name must be 3-100 characters (letters, numbers, spaces, &, -)',
    example: 'ABC Logistics Pvt Ltd',
  },

  /**
   * Role Validation
   * - Must be one of: SHIPPER, CARRIER, DRIVER
   */
  ROLE: {
    allowed: ['SHIPPER', 'CARRIER', 'DRIVER'] as const,
    message: 'Role must be SHIPPER, CARRIER, or DRIVER',
  },

  /**
   * OTP Validation
   * - Exactly 6 digits
   */
  OTP: {
    pattern: /^\d{6}$/,
    length: 6,
    message: 'OTP must be exactly 6 digits',
    example: '123456',
  },
};

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fields?: {
    [key: string]: string; // Field-specific error messages
  };
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

// ============================================================================
// Phone Number Validation
// ============================================================================

/**
 * Validate phone number with context tracking
 *
 * Guardrails:
 * - Normalizes input (removes spaces, dashes)
 * - Validates against frozen regex (HARD CONSTRAINT)
 * - Returns structured result with field-level error
 *
 * @param phoneNumber - Raw phone number input
 * @param fieldName - Field name for error tracking (default: 'phoneNumber')
 * @returns Structured validation result
 */
export const validatePhoneNumber = (
  phoneNumber: string,
  fieldName: string = 'phoneNumber'
): FieldValidationResult => {
  // Context tracking: Normalize input
  const normalized = phoneNumber.replace(/[\s-]/g, '').trim();

  // GUARDRAIL: Empty check
  if (!normalized) {
    return {
      isValid: false,
      error: 'Phone number is required',
    };
  }

  // GUARDRAIL: Pattern validation (HARD CONSTRAINT)
  if (!VALIDATION_RULES.PHONE.pattern.test(normalized)) {
    return {
      isValid: false,
      error: VALIDATION_RULES.PHONE.message,
    };
  }

  // Context tracking: Log successful validation
  console.log(`[validation] ${fieldName}: Valid phone number`);

  return { isValid: true };
};

/**
 * Normalize phone number to backend format
 * - Removes +91 prefix if present
 * - Returns 10-digit number only
 *
 * @param phoneNumber - Phone number with/without +91
 * @returns 10-digit phone number
 */
export const normalizePhoneNumber = (phoneNumber: string): string => {
  const normalized = phoneNumber.replace(/[\s-]/g, '').trim();

  // Remove +91 prefix if present
  if (normalized.startsWith('+91')) {
    return normalized.substring(3);
  }
  if (normalized.startsWith('91') && normalized.length === 12) {
    return normalized.substring(2);
  }

  return normalized;
};

// ============================================================================
// Business Name Validation
// ============================================================================

/**
 * Validate business name for shipper registration
 *
 * Guardrails:
 * - Length validation (HARD CONSTRAINT: 3-100 chars)
 * - Pattern validation (alphanumeric + spaces, &, -)
 * - Returns structured result
 *
 * @param businessName - Business name input
 * @param fieldName - Field name for error tracking
 * @returns Structured validation result
 */
export const validateBusinessName = (
  businessName: string,
  fieldName: string = 'businessName'
): FieldValidationResult => {
  // GUARDRAIL: Trim whitespace
  const trimmed = businessName.trim();

  // GUARDRAIL: Empty check
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Business name is required',
    };
  }

  // GUARDRAIL: Length validation (HARD CONSTRAINT)
  if (trimmed.length < VALIDATION_RULES.BUSINESS_NAME.minLength) {
    return {
      isValid: false,
      error: `Business name must be at least ${VALIDATION_RULES.BUSINESS_NAME.minLength} characters`,
    };
  }

  if (trimmed.length > VALIDATION_RULES.BUSINESS_NAME.maxLength) {
    return {
      isValid: false,
      error: `Business name cannot exceed ${VALIDATION_RULES.BUSINESS_NAME.maxLength} characters`,
    };
  }

  // GUARDRAIL: Pattern validation
  if (!VALIDATION_RULES.BUSINESS_NAME.pattern.test(trimmed)) {
    return {
      isValid: false,
      error: VALIDATION_RULES.BUSINESS_NAME.message,
    };
  }

  // Context tracking: Log successful validation
  console.log(`[validation] ${fieldName}: Valid business name`);

  return { isValid: true };
};

// ============================================================================
// Role Validation
// ============================================================================

/**
 * Validate user role selection
 *
 * Guardrails:
 * - Checks against frozen allowed list (HARD CONSTRAINT)
 * - Case-insensitive comparison
 *
 * @param role - Selected role
 * @returns Structured validation result
 */
export const validateRole = (role: string): FieldValidationResult => {
  // GUARDRAIL: Empty check
  if (!role) {
    return {
      isValid: false,
      error: 'Role selection is required',
    };
  }

  // GUARDRAIL: Allowed values check (HARD CONSTRAINT)
  const roleUpper = role.toUpperCase();
  if (!VALIDATION_RULES.ROLE.allowed.includes(roleUpper as any)) {
    return {
      isValid: false,
      error: VALIDATION_RULES.ROLE.message,
    };
  }

  // Context tracking: Log successful validation
  console.log(`[validation] role: Valid selection - ${roleUpper}`);

  return { isValid: true };
};

// ============================================================================
// OTP Validation
// ============================================================================

/**
 * Validate OTP input
 *
 * Guardrails:
 * - Exactly 6 digits (HARD CONSTRAINT)
 * - No letters or special characters
 *
 * @param otp - OTP input
 * @returns Structured validation result
 */
export const validateOTP = (otp: string): FieldValidationResult => {
  // GUARDRAIL: Trim whitespace
  const trimmed = otp.trim();

  // GUARDRAIL: Empty check
  if (!trimmed) {
    return {
      isValid: false,
      error: 'OTP is required',
    };
  }

  // GUARDRAIL: Pattern validation (HARD CONSTRAINT: exactly 6 digits)
  if (!VALIDATION_RULES.OTP.pattern.test(trimmed)) {
    return {
      isValid: false,
      error: VALIDATION_RULES.OTP.message,
    };
  }

  // Context tracking: Log successful validation
  console.log('[validation] otp: Valid 6-digit OTP');

  return { isValid: true };
};

// ============================================================================
// Registration Form Validation (Complete)
// ============================================================================

export interface RegistrationFormData {
  phoneNumber: string;
  role: string;
  businessName?: string;
}

/**
 * Validate complete registration form
 *
 * Context Tracking:
 * - Validates all fields in sequence
 * - Aggregates field-level errors
 * - Returns structured result with all errors
 *
 * Guardrails:
 * - All validations use frozen rules
 * - Business name required only for SHIPPER (SOFT CONSTRAINT)
 * - Short-circuits on empty required fields
 *
 * @param data - Registration form data
 * @returns Structured validation result with all errors
 */
export const validateRegistrationForm = (
  data: RegistrationFormData
): ValidationResult => {
  const errors: string[] = [];
  const fields: { [key: string]: string } = {};

  // Context tracking: Log validation start
  console.log('[validation] Starting registration form validation');

  // GUARDRAIL: Validate phone number
  const phoneValidation = validatePhoneNumber(data.phoneNumber);
  if (!phoneValidation.isValid) {
    errors.push(phoneValidation.error!);
    fields.phoneNumber = phoneValidation.error!;
  }

  // GUARDRAIL: Validate role
  const roleValidation = validateRole(data.role);
  if (!roleValidation.isValid) {
    errors.push(roleValidation.error!);
    fields.role = roleValidation.error!;
  }

  // GUARDRAIL: Validate business name (required for SHIPPER only)
  if (data.role?.toUpperCase() === 'SHIPPER') {
    if (!data.businessName) {
      errors.push('Business name is required for shippers');
      fields.businessName = 'Business name is required for shippers';
    } else {
      const businessNameValidation = validateBusinessName(data.businessName);
      if (!businessNameValidation.isValid) {
        errors.push(businessNameValidation.error!);
        fields.businessName = businessNameValidation.error!;
      }
    }
  }

  const isValid = errors.length === 0;

  // Context tracking: Log validation result
  if (isValid) {
    console.log('[validation] Registration form valid ✅');
  } else {
    console.warn('[validation] Registration form invalid ❌', errors);
  }

  return {
    isValid,
    errors,
    fields: Object.keys(fields).length > 0 ? fields : undefined,
  };
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format phone number for display
 * - Adds +91 prefix
 * - Formats as +91 XXXXX XXXXX
 *
 * @param phoneNumber - 10-digit phone number
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  const normalized = normalizePhoneNumber(phoneNumber);

  if (normalized.length !== 10) {
    return phoneNumber; // Return as-is if invalid
  }

  return `+91 ${normalized.substring(0, 5)} ${normalized.substring(5)}`;
};

/**
 * Check if role requires business details
 *
 * @param role - User role
 * @returns True if business details required
 */
export const requiresBusinessDetails = (role: string): boolean => {
  return role?.toUpperCase() === 'SHIPPER';
};

export default {
  validatePhoneNumber,
  validateBusinessName,
  validateRole,
  validateOTP,
  validateRegistrationForm,
  normalizePhoneNumber,
  formatPhoneNumber,
  requiresBusinessDetails,
  VALIDATION_RULES,
};
