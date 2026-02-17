/**
 * useAuth Hook Tests
 * Tests authentication state management and methods
 */

import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { api } from '../../services/api';

// Mock the API
jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Initialization', () => {
    it('should initialize with no user when no token exists', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should load user when valid token exists', async () => {
      const mockUser = {
        id: 'user-123',
        phoneNumber: '+919876543210',
        businessName: 'Test Business',
        userType: 'SHIPPER' as const,
        verified: true,
      };

      localStorageMock.setItem('ubertruck_token', 'valid-token');
      mockedApi.getUserProfile.mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear invalid token and logout', async () => {
      localStorageMock.setItem('ubertruck_token', 'invalid-token');
      mockedApi.getUserProfile.mockRejectedValueOnce(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorageMock.getItem('ubertruck_token')).toBeNull();
    });
  });

  describe('login', () => {
    it('should send OTP and return sessionId', async () => {
      const mockResponse = {
        message: 'OTP sent',
        sessionId: 'session-123',
        otpExpiresIn: 300,
        requestId: 'req-123',
      };

      mockedApi.login.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth());

      let loginResult: any;
      await act(async () => {
        loginResult = await result.current.login('+919876543210');
      });

      expect(loginResult.sessionId).toBe('session-123');
      expect(loginResult.otpExpiresIn).toBe(300);
      expect(mockedApi.login).toHaveBeenCalledWith('+919876543210');
    });

    it('should set error on login failure', async () => {
      mockedApi.login.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.login('+919876543210');
        } catch (err) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and set user state', async () => {
      const mockAuthResponse = {
        success: true,
        token: 'jwt-token-123',
        refreshToken: 'refresh-token-123',
        expiresIn: 3600,
        user: {
          id: 'user-123',
          phoneNumber: '+919876543210',
          businessName: 'Test Business',
          userType: 'SHIPPER' as const,
          verified: true,
        },
        requestId: 'req-123',
      };

      mockedApi.verifyOtp.mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.verifyOtp('+919876543210', '123456', 'session-123');
      });

      expect(result.current.user).toEqual(mockAuthResponse.user);
      expect(result.current.token).toBe('jwt-token-123');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should set error on invalid OTP', async () => {
      mockedApi.verifyOtp.mockRejectedValueOnce(new Error('Invalid OTP'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.verifyOtp('+919876543210', '000000', 'session-123');
        } catch (err) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockUser = {
        id: 'user-123',
        phoneNumber: '+919876543210',
        businessName: 'Updated Business',
        userType: 'SHIPPER' as const,
        verified: true,
      };

      // Set initial state
      localStorageMock.setItem('ubertruck_token', 'valid-token');
      mockedApi.getUserProfile.mockResolvedValue(mockUser);
      mockedApi.updateUserProfile.mockResolvedValueOnce({});

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.updateProfile({ businessName: 'Updated Business' });
      });

      expect(mockedApi.updateUserProfile).toHaveBeenCalledWith({
        businessName: 'Updated Business',
      });
      expect(result.current.user?.businessName).toBe('Updated Business');
    });
  });

  describe('logout', () => {
    it('should clear tokens and user state', () => {
      localStorageMock.setItem('ubertruck_token', 'token-123');
      localStorageMock.setItem('ubertruck_refresh_token', 'refresh-123');

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.logout();
      });

      expect(localStorageMock.getItem('ubertruck_token')).toBeNull();
      expect(localStorageMock.getItem('ubertruck_refresh_token')).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockedApi.login.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.login('+919876543210');
        } catch (err) {
          // Expected
        }
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
