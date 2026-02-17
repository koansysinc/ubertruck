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
import { api, ApiErrorClass, RegisterRequest, RegisterResponse } from '../services/api';
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
  otp?: string; // OTP in development mode
}

interface RegisterResult {
  userId: string;
  sessionId?: string;
  otpExpiresIn?: number;
  otp?: string; // Only in development
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
   * Register new user with phone number and role
   * Returns userId and sessionId for OTP verification
   *
   * Context Tracking:
   * - Clears previous errors (UX state)
   * - Validates inputs via API layer
   * - Returns userId for context propagation
   *
   * Guardrails:
   * - Phone validation enforced by API
   * - Role validation enforced by API
   * - Error transformation to user-friendly messages
   */
  const register = useCallback(async (data: RegisterRequest): Promise<RegisterResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response: RegisterResponse = await api.register(data);
      setState(prev => ({ ...prev, isLoading: false }));

      // Context tracking: Log successful registration
      console.log(`[useAuth] User registered: ${response.userId}, role: ${response.role}`);

      return {
        userId: response.userId,
        sessionId: response.userId, // Backend returns userId, we'll use phone for sessionId
        otpExpiresIn: 300, // 5 minutes default
        otp: response.otp, // Only in development
      };
    } catch (error: any) {
      // Error transformation with context
      const errorMessage = error instanceof ApiErrorClass
        ? error.message
        : 'Failed to register. Please try again.';

      // Context tracking: Log registration failure
      console.error(`[useAuth] Registration failed: ${errorMessage}`, error);

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
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

      // Log OTP in development mode
      if (response.otp) {
        console.log(`[useAuth] Login OTP: ${response.otp}`);
      }

      return {
        sessionId: response.sessionId,
        otpExpiresIn: response.otpExpiresIn,
        otp: response.otp, // Include OTP for development mode
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
    register,
    login,
    verifyOtp,
    updateProfile,
    logout,
    clearError,
  };
};

export default useAuth;
