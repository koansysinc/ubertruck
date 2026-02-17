/**
 * PhoneEntry Screen
 *
 * First step of authentication flow
 * - User enters phone number
 * - Validates format (Indian numbers only)
 * - Calls POST /auth/login
 * - On success, navigates to OTP verification
 */

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';

interface PhoneEntryProps {
  onSuccess: (sessionId: string, phoneNumber: string, otpExpiresIn: number) => void;
}

// Validation pattern for Indian phone numbers
const PHONE_PATTERN = /^[6-9]\d{9}$/;

const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const cleaned = value.replace(/\D/g, '');

  // Limit to 10 digits
  return cleaned.slice(0, 10);
};

const isValidPhone = (phone: string): boolean => {
  return PHONE_PATTERN.test(phone);
};

export const PhoneEntry: React.FC<PhoneEntryProps> = ({ onSuccess }) => {
  const { login, isLoading, error, clearError } = useAuthContext();
  const [phone, setPhone] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);

    // Clear validation error when user types
    if (validationError) {
      setValidationError(null);
    }
  };

  const handlePhoneBlur = () => {
    setTouched(true);

    // Validate on blur
    if (phone && !isValidPhone(phone)) {
      setValidationError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark as touched
    setTouched(true);

    // Validate phone
    if (!phone) {
      setValidationError('Phone number is required');
      return;
    }

    if (!isValidPhone(phone)) {
      setValidationError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9');
      return;
    }

    try {
      // Add +91 prefix
      const phoneWithPrefix = `+91${phone}`;

      // Call login API
      const result = await login(phoneWithPrefix);

      // Navigate to OTP screen
      onSuccess(result.sessionId, phoneWithPrefix, result.otpExpiresIn);
    } catch (err) {
      // Error is already set in auth context
      console.error('Login error:', err);
    }
  };

  const displayError = validationError || error;
  const showError = touched && displayError;

  return (
    <div className="h-full w-full bg-white p-6 flex flex-col">
      {/* Header */}
      <div className="mt-12 mb-8">
        <h2 className="text-3xl font-bold mb-2">Get moving with UberTruck</h2>
        <p className="text-gray-500">Enter your mobile number to continue</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Phone Input */}
        <div className="mb-6">
          <div className={`flex items-center gap-3 bg-gray-100 p-4 rounded-xl border-2 transition-colors ${
            showError ? 'border-red-500' : 'border-transparent focus-within:border-black'
          }`}>
            <span className="font-bold border-r border-gray-300 pr-3">🇮🇳 +91</span>
            <input
              type="tel"
              placeholder="Enter phone number"
              className="bg-transparent outline-none w-full text-lg"
              value={phone}
              onChange={handlePhoneChange}
              onBlur={handlePhoneBlur}
              disabled={isLoading}
              maxLength={10}
              inputMode="numeric"
              autoFocus
            />
          </div>

          {/* Error Message */}
          {showError && (
            <p className="text-red-500 text-sm mt-2 ml-1">
              {displayError}
            </p>
          )}

          {/* Helper Text */}
          {!showError && (
            <p className="text-gray-400 text-xs mt-2 ml-1">
              We'll send you a 6-digit verification code
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !phone || !isValidPhone(phone)}
          className={`w-full py-4 rounded-xl font-bold transition-all ${
            isLoading || !phone || !isValidPhone(phone)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-black text-white active:scale-95'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Sending OTP...
            </span>
          ) : (
            'Next'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="mt-8 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-[1px] bg-gray-200 flex-1"></div>
          <span className="text-gray-400 text-sm">or connect with</span>
          <div className="h-[1px] bg-gray-200 flex-1"></div>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          className="flex-1 border border-gray-200 p-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all"
          disabled={isLoading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-sm font-medium">Google</span>
        </button>

        <button
          type="button"
          className="flex-1 border border-gray-200 p-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all"
          disabled={isLoading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          <span className="text-sm font-medium">Apple</span>
        </button>
      </div>

      {/* Terms */}
      <p className="mt-auto text-xs text-gray-400 text-center">
        By continuing, you agree to UberTruck's{' '}
        <a href="#" className="underline">Terms of Service</a> and{' '}
        <a href="#" className="underline">Privacy Policy</a>
      </p>
    </div>
  );
};

export default PhoneEntry;
