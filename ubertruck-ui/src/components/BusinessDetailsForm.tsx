/**
 * BusinessDetailsForm Component
 *
 * Production-ready business details input for SHIPPER registration
 *
 * Context Tracking:
 * - Validates business name in real-time
 * - Logs validation events
 * - Field-level error tracking
 *
 * Guardrails:
 * - Business name: 3-100 characters (HARD CONSTRAINT)
 * - Alphanumeric + spaces, &, - only
 * - Required for SHIPPER role
 */

import React, { useState, useEffect } from 'react';
import { validateBusinessName } from '../utils/validation';

export interface BusinessDetails {
  businessName: string;
}

interface BusinessDetailsFormProps {
  businessDetails: BusinessDetails | null;
  onChange: (details: BusinessDetails) => void;
  error?: string | null;
  disabled?: boolean;
}

export const BusinessDetailsForm: React.FC<BusinessDetailsFormProps> = ({
  businessDetails,
  onChange,
  error,
  disabled = false,
}) => {
  const [businessName, setBusinessName] = useState(
    businessDetails?.businessName || ''
  );
  const [touched, setTouched] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update local state when prop changes
  useEffect(() => {
    if (businessDetails) {
      setBusinessName(businessDetails.businessName);
    }
  }, [businessDetails]);

  const handleBlur = () => {
    setTouched(true);

    // Context tracking: Log blur event
    console.log('[BusinessDetailsForm] Field blurred, validating...');

    // GUARDRAIL: Validate on blur
    const result = validateBusinessName(businessName);
    if (!result.isValid) {
      setValidationError(result.error || null);
    } else {
      setValidationError(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBusinessName(value);

    // Clear validation error while typing
    if (validationError) {
      setValidationError(null);
    }

    // Context tracking: Propagate change
    onChange({ businessName: value });
  };

  // Determine which error to show
  const displayError = error || (touched ? validationError : null);

  return (
    <div style={styles.container}>
      <label htmlFor="businessName" style={styles.label}>
        Business Name <span style={styles.required}>*</span>
      </label>

      <input
        id="businessName"
        type="text"
        value={businessName}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder="e.g., ABC Logistics Pvt Ltd"
        style={{
          ...styles.input,
          ...(displayError ? styles.inputError : {}),
          ...(disabled ? styles.inputDisabled : {}),
        }}
        maxLength={100}
        aria-invalid={!!displayError}
        aria-describedby={displayError ? 'businessName-error' : undefined}
      />

      {displayError && (
        <div id="businessName-error" style={styles.error} role="alert">
          {displayError}
        </div>
      )}

      <p style={styles.hint}>
        Enter your registered business or company name (3-100 characters)
      </p>
    </div>
  );
};

// ============================================================================
// Styles (Inline for zero external dependencies)
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    marginBottom: '1.5rem',
  },

  label: {
    display: 'block',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#333',
    marginBottom: '0.5rem',
  },

  required: {
    color: '#e53e3e',
  },

  input: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '0.375rem',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  },

  inputError: {
    borderColor: '#e53e3e',
  },

  inputDisabled: {
    backgroundColor: '#f7fafc',
    cursor: 'not-allowed',
    opacity: 0.6,
  },

  error: {
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    color: '#e53e3e',
  },

  hint: {
    fontSize: '0.875rem',
    color: '#718096',
    margin: '0.5rem 0 0 0',
  },
};

export default BusinessDetailsForm;
