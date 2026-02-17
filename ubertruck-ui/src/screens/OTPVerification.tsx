/**
 * OTPVerification Screen
 *
 * Second step of authentication flow
 * - User enters 6-digit OTP
 * - Shows 5-minute countdown timer
 * - Calls POST /auth/verify-otp
 * - On success, stores JWT and navigates to dashboard
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../context/AuthContext';

interface OTPVerificationProps {
  sessionId: string;
  phoneNumber: string;
  otpExpiresIn: number; // seconds
  devOtp?: string; // OTP shown in development mode
  onSuccess: () => void;
  onBack: () => void;
}

const OTP_LENGTH = 6;

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  sessionId,
  phoneNumber,
  otpExpiresIn,
  devOtp,
  onSuccess,
  onBack,
}) => {
  const { verifyOtp, login, isLoading, error, clearError } = useAuthContext();
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(otpExpiresIn);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Clear errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Log OTP in development mode
  useEffect(() => {
    if (devOtp) {
      console.log(`[OTPVerification] Development OTP: ${devOtp}`);
    }
  }, [devOtp]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(0, 1);

    // Update OTP
    const newOtp = otp.split('');
    newOtp[index] = digit;
    const updatedOtp = newOtp.join('');
    setOtp(updatedOtp);

    // Auto-focus next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Clear error when user types
    if (error) {
      clearError();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace: focus previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Left arrow: focus previous
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Right arrow: focus next
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(pastedData);

    // Focus last input
    if (pastedData.length === OTP_LENGTH) {
      inputRefs.current[OTP_LENGTH - 1]?.focus();
    } else if (pastedData.length > 0) {
      inputRefs.current[pastedData.length - 1]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (otp.length !== OTP_LENGTH) {
      return;
    }

    try {
      await verifyOtp(phoneNumber, otp, sessionId);
      onSuccess();
    } catch (err) {
      // Error is already set in auth context
      console.error('OTP verification error:', err);
      // Clear OTP on error
      setOtp('');
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setResending(true);
    clearError();

    try {
      await login(phoneNumber);
      setTimeLeft(300); // Reset to 5 minutes
      setCanResend(false);
      setOtp('');
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('Resend OTP error:', err);
    } finally {
      setResending(false);
    }
  };

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.length === OTP_LENGTH && !isLoading) {
      handleSubmit();
    }
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  const maskPhoneNumber = (phone: string): string => {
    // +919876543210 -> +91 98765 ••••••
    const cleaned = phone.replace(/\D/g, '');
    return `+91 ${cleaned.slice(2, 7)} ${'•'.repeat(5)}`;
  };

  return (
    <div className="h-full w-full bg-white p-6 flex flex-col">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all mb-8"
        disabled={isLoading}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Verify your number</h2>
        <p className="text-gray-500">
          We've sent a 6-digit code to <span className="font-semibold text-black">{maskPhoneNumber(phoneNumber)}</span>
        </p>
      </div>

      {/* Development OTP Display */}
      {devOtp && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold text-yellow-800">Development Mode</span>
          </div>
          <p className="text-sm text-yellow-700 mb-2">Your OTP is:</p>
          <p className="text-2xl font-bold text-yellow-900 font-mono tracking-widest">{devOtp}</p>
        </div>
      )}

      {/* OTP Input */}
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 mb-6" onPaste={handlePaste}>
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={otp[index] || ''}
              onChange={e => handleOtpChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              disabled={isLoading}
              className={`flex-1 aspect-square text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all ${
                error
                  ? 'border-red-500 bg-red-50'
                  : otp[index]
                  ? 'border-black bg-gray-50'
                  : 'border-gray-300 focus:border-black'
              }`}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6 text-sm flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Timer / Resend */}
        <div className="text-center mb-8">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-yellow-600 font-bold text-sm hover:text-yellow-700 active:scale-95 transition-all"
            >
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              Code expires in{' '}
              <span className={`font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-black'}`}>
                {formatTime(timeLeft)}
              </span>
            </p>
          )}
        </div>

        {/* Submit Button (shown when manually submitting) */}
        {otp.length === OTP_LENGTH && !isLoading && (
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-black text-white font-bold active:scale-95 transition-all"
          >
            Verify OTP
          </button>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-gray-500">
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
            <span className="text-sm">Verifying...</span>
          </div>
        )}
      </form>

      {/* Help Text */}
      <div className="mt-auto">
        <p className="text-xs text-gray-400 text-center">
          Didn't receive the code?{' '}
          <button
            onClick={handleResend}
            disabled={!canResend || resending}
            className={`underline ${
              canResend && !resending ? 'text-yellow-600' : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            Resend
          </button>
        </p>
      </div>
    </div>
  );
};

export default OTPVerification;
