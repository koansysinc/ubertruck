/**
 * AuthContext
 *
 * Provides authentication state and methods to entire app
 * - Wraps app with AuthProvider
 * - Access auth via useAuthContext hook
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, AuthResponse } from '../types';
import { RegisterRequest } from '../services/api';

interface LoginResult {
  sessionId: string;
  otpExpiresIn: number;
}

interface RegisterResult {
  userId: string;
  sessionId?: string;
  otpExpiresIn?: number;
  otp?: string; // Only in development
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  register: (data: RegisterRequest) => Promise<RegisterResult>;
  login: (phoneNumber: string) => Promise<LoginResult>;
  verifyOtp: (phoneNumber: string, otp: string, sessionId: string) => Promise<AuthResponse>;
  updateProfile: (profile: Partial<User>) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component
 * Wrap app with this to provide auth state
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access auth context
 * Usage: const { user, login, logout } = useAuthContext();
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
};

export default AuthContext;
