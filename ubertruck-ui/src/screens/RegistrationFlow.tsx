/**
 * RegistrationFlow Screen
 *
 * Production-ready multi-step registration with context tracking & guardrails
 *
 * Flow:
 * 1. Phone Number Entry
 * 2. Role Selection
 * 3. Business Details (if SHIPPER)
 * 4. Terms Agreement
 * 5. Submit → OTP Verification
 *
 * Context Tracking:
 * - Step navigation logging
 * - Form data validation at each step
 * - Request ID propagation
 *
 * Guardrails:
 * - Step-by-step validation (can't skip steps)
 * - Business details required only for SHIPPER
 * - All frozen requirements enforced
 */

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { RoleSelector, UserRole } from '../components/RoleSelector';
import { BusinessDetailsForm, BusinessDetails } from '../components/BusinessDetailsForm';
import { TermsAgreement } from '../components/TermsAgreement';
import {
  validatePhoneNumber,
  validateRegistrationForm,
  normalizePhoneNumber,
  requiresBusinessDetails,
} from '../utils/validation';

interface RegistrationFlowProps {
  onSuccess: (sessionId: string, phoneNumber: string, otp?: string) => void;
  onBackToLogin: () => void;
}

type Step = 'phone' | 'role' | 'business' | 'terms';

export const RegistrationFlow: React.FC<RegistrationFlowProps> = ({
  onSuccess,
  onBackToLogin,
}) => {
  const { register, isLoading, error: authError, clearError } = useAuthContext();

  // Form state
  const [currentStep, setCurrentStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Validation state
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Clear auth errors when component mounts
  useEffect(() => {
    clearError();
    console.log('[RegistrationFlow] Component mounted');
  }, [clearError]);

  // Format phone number (auto-format as user types)
  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.slice(0, 10);
  };

  // Step 1: Phone Number Entry
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    if (phoneError) setPhoneError(null);
  };

  const handlePhoneNext = () => {
    setTouched(true);

    // GUARDRAIL: Validate phone before proceeding
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      setPhoneError(validation.error || 'Invalid phone number');
      return;
    }

    // Context tracking: Log step progression
    console.log(`[RegistrationFlow] Step 1 → 2 (phone: ${phoneNumber})`);

    setCurrentStep('role');
    setPhoneError(null);
  };

  // Step 2: Role Selection
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setRoleError(null);

    // Context tracking: Log role selection
    console.log(`[RegistrationFlow] Role selected: ${role}`);
  };

  const handleRoleNext = () => {
    // GUARDRAIL: Validate role before proceeding
    if (!selectedRole) {
      setRoleError('Please select a role');
      return;
    }

    // Context tracking: Log step progression
    console.log(`[RegistrationFlow] Step 2 → 3 (role: ${selectedRole})`);

    // GUARDRAIL: Skip business details if not SHIPPER
    if (requiresBusinessDetails(selectedRole)) {
      setCurrentStep('business');
    } else {
      setCurrentStep('terms');
    }
    setRoleError(null);
  };

  // Step 3: Business Details (SHIPPER only)
  const handleBusinessDetailsChange = (details: BusinessDetails) => {
    setBusinessDetails(details);
    if (businessError) setBusinessError(null);
  };

  const handleBusinessNext = () => {
    // GUARDRAIL: Validate business name before proceeding
    if (!businessDetails?.businessName || businessDetails.businessName.trim().length < 3) {
      setBusinessError('Business name must be at least 3 characters');
      return;
    }

    // Context tracking: Log step progression
    console.log(`[RegistrationFlow] Step 3 → 4 (business: ${businessDetails.businessName})`);

    setCurrentStep('terms');
    setBusinessError(null);
  };

  // Step 4: Terms Agreement
  const handleTermsChange = (agreed: boolean) => {
    setTermsAgreed(agreed);
    if (termsError) setTermsError(null);
  };

  // Final Submit
  const handleSubmit = async () => {
    // GUARDRAIL: Final validation before submission
    if (!termsAgreed) {
      setTermsError('You must agree to the terms and conditions');
      return;
    }

    // Context tracking: Log registration attempt
    console.log('[RegistrationFlow] Submitting registration...', {
      phoneNumber,
      role: selectedRole,
      businessName: businessDetails?.businessName,
    });

    try {
      // Call register API
      // Add +91 prefix if not present (API validation requires it)
      const phoneWithPrefix = phoneNumber.startsWith('+91')
        ? phoneNumber
        : `+91${phoneNumber}`;

      const result = await register({
        phoneNumber: phoneWithPrefix,
        role: selectedRole!,
        businessName: businessDetails?.businessName,
      });

      // Context tracking: Log success
      console.log('[RegistrationFlow] Registration successful ✅', {
        userId: result.userId,
        otp: result.otp ? '***' + result.otp.slice(-2) : undefined,
      });

      // Success - navigate to OTP verification
      onSuccess(result.sessionId || result.userId, phoneWithPrefix, result.otp);
    } catch (err) {
      // Error handled by useAuth hook
      console.error('[RegistrationFlow] Registration failed ❌', err);
    }
  };

  // Back button handlers
  const handleBack = () => {
    if (currentStep === 'phone') {
      onBackToLogin();
    } else if (currentStep === 'role') {
      setCurrentStep('phone');
    } else if (currentStep === 'business') {
      setCurrentStep('role');
    } else if (currentStep === 'terms') {
      if (requiresBusinessDetails(selectedRole!)) {
        setCurrentStep('business');
      } else {
        setCurrentStep('role');
      }
    }

    // Context tracking: Log step back
    console.log(`[RegistrationFlow] Back from ${currentStep}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>
            Join UberTruck to start shipping or offering transport services
          </p>
        </div>

        {/* Progress Indicator */}
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${getProgressPercentage(currentStep, selectedRole)}%`,
              }}
            />
          </div>
          <p style={styles.progressText}>
            Step {getStepNumber(currentStep, selectedRole)} of {getTotalSteps(selectedRole)}
          </p>
        </div>

        {/* Error Display */}
        {authError && (
          <div style={styles.errorBanner} role="alert">
            <span style={styles.errorIcon}>⚠️</span>
            {authError}
          </div>
        )}

        {/* Step Content */}
        <div style={styles.content}>
          {/* Step 1: Phone Number */}
          {currentStep === 'phone' && (
            <div style={styles.step}>
              <label htmlFor="phone" style={styles.label}>
                Mobile Number <span style={styles.required}>*</span>
              </label>
              <div style={styles.phoneInputWrapper}>
                <span style={styles.phonePrefix}>+91</span>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="9876543210"
                  maxLength={10}
                  style={{
                    ...styles.phoneInput,
                    ...(phoneError ? styles.inputError : {}),
                  }}
                  disabled={isLoading}
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? 'phone-error' : undefined}
                />
              </div>
              {phoneError && (
                <div id="phone-error" style={styles.errorText} role="alert">
                  {phoneError}
                </div>
              )}
              <p style={styles.hint}>Enter your 10-digit mobile number</p>
            </div>
          )}

          {/* Step 2: Role Selection */}
          {currentStep === 'role' && (
            <div style={styles.step}>
              <RoleSelector
                selectedRole={selectedRole}
                onChange={handleRoleSelect}
                error={roleError}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Step 3: Business Details */}
          {currentStep === 'business' && (
            <div style={styles.step}>
              <BusinessDetailsForm
                businessDetails={businessDetails}
                onChange={handleBusinessDetailsChange}
                error={businessError}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Step 4: Terms Agreement */}
          {currentStep === 'terms' && (
            <div style={styles.step}>
              <TermsAgreement
                agreed={termsAgreed}
                onChange={handleTermsChange}
                error={termsError}
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={styles.actions}>
          <button
            onClick={handleBack}
            disabled={isLoading}
            style={{
              ...styles.button,
              ...styles.buttonSecondary,
              ...(isLoading ? styles.buttonDisabled : {}),
            }}
          >
            Back
          </button>

          {currentStep === 'phone' && (
            <button
              onClick={handlePhoneNext}
              disabled={isLoading || !phoneNumber}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                ...(isLoading || !phoneNumber ? styles.buttonDisabled : {}),
              }}
            >
              Next
            </button>
          )}

          {currentStep === 'role' && (
            <button
              onClick={handleRoleNext}
              disabled={isLoading || !selectedRole}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                ...(isLoading || !selectedRole ? styles.buttonDisabled : {}),
              }}
            >
              Next
            </button>
          )}

          {currentStep === 'business' && (
            <button
              onClick={handleBusinessNext}
              disabled={isLoading || !businessDetails?.businessName}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                ...(isLoading || !businessDetails?.businessName ? styles.buttonDisabled : {}),
              }}
            >
              Next
            </button>
          )}

          {currentStep === 'terms' && (
            <button
              onClick={handleSubmit}
              disabled={isLoading || !termsAgreed}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                ...(isLoading || !termsAgreed ? styles.buttonDisabled : {}),
              }}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          )}
        </div>

        {/* Login Link */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Already have an account?{' '}
            <button onClick={onBackToLogin} style={styles.link} disabled={isLoading}>
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

const getStepNumber = (step: Step, role: UserRole | null): number => {
  if (step === 'phone') return 1;
  if (step === 'role') return 2;
  if (step === 'business') return 3;
  if (step === 'terms') {
    return requiresBusinessDetails(role || 'CARRIER') ? 4 : 3;
  }
  return 1;
};

const getTotalSteps = (role: UserRole | null): number => {
  return requiresBusinessDetails(role || 'CARRIER') ? 4 : 3;
};

const getProgressPercentage = (step: Step, role: UserRole | null): number => {
  const stepNumber = getStepNumber(step, role);
  const totalSteps = getTotalSteps(role);
  return (stepNumber / totalSteps) * 100;
};

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7fafc',
    padding: '1rem',
  },

  card: {
    width: '100%',
    maxWidth: '600px',
    backgroundColor: '#fff',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '2rem',
  },

  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },

  title: {
    fontSize: '1.875rem',
    fontWeight: 700,
    color: '#2d3748',
    marginBottom: '0.5rem',
  },

  subtitle: {
    fontSize: '1rem',
    color: '#718096',
    margin: 0,
  },

  progressContainer: {
    marginBottom: '2rem',
  },

  progressBar: {
    height: '0.5rem',
    backgroundColor: '#e2e8f0',
    borderRadius: '0.25rem',
    overflow: 'hidden',
    marginBottom: '0.5rem',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#3182ce',
    transition: 'width 0.3s ease',
  },

  progressText: {
    fontSize: '0.875rem',
    color: '#718096',
    textAlign: 'center',
    margin: 0,
  },

  errorBanner: {
    padding: '1rem',
    backgroundColor: '#fff5f5',
    border: '1px solid #fc8181',
    borderRadius: '0.375rem',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },

  errorIcon: {
    fontSize: '1.25rem',
  },

  content: {
    marginBottom: '2rem',
  },

  step: {
    minHeight: '200px',
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

  phoneInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },

  phonePrefix: {
    padding: '0.75rem',
    backgroundColor: '#e2e8f0',
    border: '2px solid #e2e8f0',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#2d3748',
  },

  phoneInput: {
    flex: 1,
    padding: '0.75rem',
    fontSize: '1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '0.375rem',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },

  inputError: {
    borderColor: '#e53e3e',
  },

  errorText: {
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    color: '#e53e3e',
  },

  hint: {
    fontSize: '0.875rem',
    color: '#718096',
    marginTop: '0.5rem',
  },

  actions: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
  },

  button: {
    flex: 1,
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
  },

  buttonPrimary: {
    backgroundColor: '#3182ce',
    color: '#fff',
  },

  buttonSecondary: {
    backgroundColor: '#fff',
    color: '#3182ce',
    border: '2px solid #3182ce',
  },

  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },

  footer: {
    textAlign: 'center',
  },

  footerText: {
    fontSize: '0.9375rem',
    color: '#718096',
    margin: 0,
  },

  link: {
    color: '#3182ce',
    textDecoration: 'underline',
    fontWeight: 600,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontSize: 'inherit',
  },
};

export default RegistrationFlow;
