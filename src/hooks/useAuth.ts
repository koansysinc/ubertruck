/**
 * useAuth Hook
 *
 * Manages authentication state and provides auth methods
 * - Login with phone number
 * - Verify OTP
 * - Logout
 * - Token refresh (automatic)
 * - Session persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { api, ApiErrorClass } from '../services/api';
import { User, AuthResponse } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface LoginResult {
  sessionId: string;
  otpExpiresIn: number;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  /**
   * Initialize auth state from localStorage on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('ubertruck_token');

        if (token) {
          // Token exists, fetch user profile
          const user = await api.getUserProfile();
          setState({
            user,
            token,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } else {
          // No token, not authenticated
          setState({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
        }
      } catch (error: any) {
        // Token invalid or expired, clear and logout
        localStorage.removeItem('ubertruck_token');
        localStorage.removeItem('ubertruck_refresh_token');
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login with phone number
   * Returns sessionId for OTP verification
   */
  const login = useCallback(async (phoneNumber: string): Promise<LoginResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await api.login(phoneNumber);
      setState(prev => ({ ...prev, isLoading: false }));

      return {
        sessionId: response.sessionId,
        otpExpiresIn: response.otpExpiresIn,
      };
    } catch (error: any) {
      const errorMessage = error instanceof ApiErrorClass
        ? error.message
        : 'Failed to send OTP. Please try again.';

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Verify OTP and complete authentication
   */
  const verifyOtp = useCallback(async (
    phoneNumber: string,
    otp: string,
    sessionId: string
  ): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await api.verifyOtp(phoneNumber, otp, sessionId);

      setState({
        user: response.user,
        token: response.token,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });

      return response;
    } catch (error: any) {
      const errorMessage = error instanceof ApiErrorClass
        ? error.message
        : 'Invalid OTP. Please try again.';

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (profile: Partial<User>): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await api.updateUserProfile(profile);

      // Fetch updated profile
      const updatedUser = await api.getUserProfile();

      setState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error instanceof ApiErrorClass
        ? error.message
        : 'Failed to update profile. Please try again.';

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Logout - clear tokens and user state
   */
  const logout = useCallback(() => {
    localStorage.removeItem('ubertruck_token');
    localStorage.removeItem('ubertruck_refresh_token');
    localStorage.removeItem('ubertruck_token_expires_at');

    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });

    // Redirect to auth page
    window.location.href = '/auth';
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,

    // Methods
    login,
    verifyOtp,
    updateProfile,
    logout,
    clearError,
  };
};

export default useAuth;
