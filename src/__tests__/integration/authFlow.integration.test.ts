/**
 * Authentication Flow Integration Tests
 *
 * Tests the complete authentication flow:
 * 1. Phone number entry → OTP sent
 * 2. OTP verification → JWT received
 * 3. Optional profile setup
 * 4. User authenticated
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';

// Mock the API
jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should complete full authentication flow: phone → OTP → profile → authenticated', async () => {
    const mockPhoneNumber = '+919876543210';
    const mockOtp = '123456';
    const mockSessionId = 'session-abc-123';

    // Mock API responses
    const mockLoginResponse = {
      message: 'OTP sent successfully',
      sessionId: mockSessionId,
      otpExpiresIn: 300,
      requestId: 'req-001',
    };

    const mockVerifyOtpResponse = {
      success: true,
      token: 'jwt-token-xyz',
      refreshToken: 'refresh-token-xyz',
      expiresIn: 3600,
      user: {
        id: 'user-123',
        phoneNumber: mockPhoneNumber,
        userType: 'SHIPPER' as const,
        verified: true,
      },
      requestId: 'req-002',
    };

    const mockProfileUpdateResponse = {};

    mockedApi.login.mockResolvedValueOnce(mockLoginResponse);
    mockedApi.verifyOtp.mockResolvedValueOnce(mockVerifyOtpResponse);
    mockedApi.updateUserProfile.mockResolvedValueOnce(mockProfileUpdateResponse);
    mockedApi.getUserProfile.mockResolvedValue(mockVerifyOtpResponse.user);

    const { result } = renderHook(() => useAuth());

    // Step 1: User enters phone number
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);

    let loginResult: any;
    await act(async () => {
      loginResult = await result.current.login(mockPhoneNumber);
    });

    // Verify OTP was sent
    expect(loginResult.sessionId).toBe(mockSessionId);
    expect(loginResult.otpExpiresIn).toBe(300);
    expect(mockedApi.login).toHaveBeenCalledWith(mockPhoneNumber);

    // Step 2: User enters OTP
    await act(async () => {
      await result.current.verifyOtp(mockPhoneNumber, mockOtp, mockSessionId);
    });

    // Verify user is authenticated
    expect(result.current.user).toEqual(mockVerifyOtpResponse.user);
    expect(result.current.token).toBe('jwt-token-xyz');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(mockedApi.verifyOtp).toHaveBeenCalledWith(mockPhoneNumber, mockOtp, mockSessionId);

    // Note: Token storage happens in api.ts, not in the hook
    // Since we're mocking the API, localStorage won't be updated
    // This is fine - we're testing the hook, not the API storage layer

    // Step 3: User updates profile (optional)
    await act(async () => {
      await result.current.updateProfile({
        businessName: 'Test Transport Co',
        gstNumber: '27AABCT1234A1Z5',
      });
    });

    expect(mockedApi.updateUserProfile).toHaveBeenCalledWith({
      businessName: 'Test Transport Co',
      gstNumber: '27AABCT1234A1Z5',
    });

    // Final state: User fully authenticated with profile
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle OTP verification failure and allow retry', async () => {
    const mockPhoneNumber = '+919876543210';
    const wrongOtp = '000000';
    const correctOtp = '123456';
    const mockSessionId = 'session-abc-123';

    // Mock login success
    mockedApi.login.mockResolvedValue({
      message: 'OTP sent successfully',
      sessionId: mockSessionId,
      otpExpiresIn: 300,
      requestId: 'req-001',
    });

    // Mock first OTP attempt fails
    mockedApi.verifyOtp.mockRejectedValueOnce(new Error('Invalid OTP'));

    // Mock second OTP attempt succeeds
    mockedApi.verifyOtp.mockResolvedValueOnce({
      success: true,
      token: 'jwt-token-xyz',
      refreshToken: 'refresh-token-xyz',
      expiresIn: 3600,
      user: {
        id: 'user-123',
        phoneNumber: mockPhoneNumber,
        userType: 'SHIPPER' as const,
        verified: true,
      },
      requestId: 'req-002',
    });

    const { result } = renderHook(() => useAuth());

    // Step 1: Send OTP
    await act(async () => {
      await result.current.login(mockPhoneNumber);
    });

    // Step 2: Wrong OTP - should fail
    await act(async () => {
      try {
        await result.current.verifyOtp(mockPhoneNumber, wrongOtp, mockSessionId);
      } catch (error) {
        // Expected to fail
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isAuthenticated).toBe(false);

    // Step 3: Correct OTP - should succeed
    await act(async () => {
      result.current.clearError();
      await result.current.verifyOtp(mockPhoneNumber, correctOtp, mockSessionId);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should restore session from localStorage on initialization', async () => {
    const mockUser = {
      id: 'user-123',
      phoneNumber: '+919876543210',
      userType: 'SHIPPER' as const,
      verified: true,
    };

    // Pre-populate localStorage
    localStorage.setItem('ubertruck_token', 'existing-token');
    localStorage.setItem('ubertruck_refresh_token', 'existing-refresh');

    // Mock getUserProfile to return user data
    mockedApi.getUserProfile.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for initialization to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have restored the session
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('existing-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockedApi.getUserProfile).toHaveBeenCalled();
  });

  it('should clear invalid tokens on initialization', async () => {
    // Pre-populate localStorage with invalid token
    localStorage.setItem('ubertruck_token', 'invalid-token');

    // Mock getUserProfile to fail (unauthorized)
    mockedApi.getUserProfile.mockRejectedValueOnce(new Error('Unauthorized'));

    const { result } = renderHook(() => useAuth());

    // Wait for initialization to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have cleared the session
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('ubertruck_token')).toBeNull();
  });

  it('should logout and clear all auth data', async () => {
    const mockUser = {
      id: 'user-123',
      phoneNumber: '+919876543210',
      userType: 'SHIPPER' as const,
      verified: true,
    };

    // Setup authenticated state
    localStorage.setItem('ubertruck_token', 'token-123');
    localStorage.setItem('ubertruck_refresh_token', 'refresh-123');
    mockedApi.getUserProfile.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth());

    // Wait for auth initialization
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // Logout
    act(() => {
      result.current.logout();
    });

    // Verify everything is cleared
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('ubertruck_token')).toBeNull();
    expect(localStorage.getItem('ubertruck_refresh_token')).toBeNull();
  });
});
