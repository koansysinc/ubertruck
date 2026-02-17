/**
 * usePriceCalculation Hook Tests
 * Tests price calculation state management and validation
 */

import { renderHook, act } from '@testing-library/react';
import { usePriceCalculation } from '../usePriceCalculation';
import { api } from '../../services/api';

// Mock the API
jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('usePriceCalculation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with null price calculation', () => {
      const { result } = renderHook(() => usePriceCalculation());

      expect(result.current.priceCalculation).toBeNull();
      expect(result.current.isCalculating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isExpired).toBe(true);
      expect(result.current.timeRemaining).toBe(0);
    });
  });

  describe('calculatePrice', () => {
    const mockRequest = {
      pickupLocation: {
        address: 'Hyderabad, Telangana',
        latitude: 17.385,
        longitude: 78.486,
        pincode: '500001',
      },
      deliveryLocation: {
        address: 'Bangalore, Karnataka',
        latitude: 12.971,
        longitude: 77.594,
        pincode: '560001',
      },
      cargoDetails: {
        type: 'GENERAL',
        weight: 5,
        description: 'General cargo',
      },
      pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
    };

    const mockPriceCalculation = {
      calculationId: 'calc-123',
      basePrice: 2500,
      distance: 500,
      cargoDetails: mockRequest.cargoDetails,
      surcharges: [
        { type: 'FUEL_SURCHARGE', amount: 250, description: 'Fuel surcharge 10%' },
      ],
      gstBreakdown: {
        cgst: 247.5,
        sgst: 247.5,
        igst: 0,
      },
      totalPrice: 3245,
      validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // +15 minutes
      currency: 'INR',
    };

    it('should calculate price successfully', async () => {
      mockedApi.calculatePrice.mockResolvedValueOnce(mockPriceCalculation);

      const { result } = renderHook(() => usePriceCalculation());

      let calculation: any;
      await act(async () => {
        calculation = await result.current.calculatePrice(mockRequest);
      });

      expect(calculation).toEqual(mockPriceCalculation);
      expect(result.current.priceCalculation).toEqual(mockPriceCalculation);
      expect(result.current.isCalculating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should validate pickup and delivery locations', async () => {
      const { result } = renderHook(() => usePriceCalculation());

      await act(async () => {
        try {
          await result.current.calculatePrice({
            ...mockRequest,
            pickupLocation: null as any,
          });
          fail('Should have thrown error');
        } catch (err: any) {
          expect(err.message).toContain('Pickup and delivery locations are required');
        }
      });
    });

    it('should validate cargo details', async () => {
      const { result } = renderHook(() => usePriceCalculation());

      await act(async () => {
        try {
          await result.current.calculatePrice({
            ...mockRequest,
            cargoDetails: null as any,
          });
          fail('Should have thrown error');
        } catch (err: any) {
          expect(err.message).toContain('Cargo details are required');
        }
      });
    });

    it('should validate pickup time is at least 1 hour in future', async () => {
      const { result } = renderHook(() => usePriceCalculation());

      await act(async () => {
        try {
          await result.current.calculatePrice({
            ...mockRequest,
            pickupTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Only +30 minutes
          });
          fail('Should have thrown error');
        } catch (err: any) {
          expect(err.message).toContain('Pickup time must be at least 1 hour in the future');
        }
      });
    });

    it('should set error on API failure', async () => {
      mockedApi.calculatePrice.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => usePriceCalculation());

      await act(async () => {
        try {
          await result.current.calculatePrice(mockRequest);
          fail('Should have thrown error');
        } catch (err: any) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.isCalculating).toBe(false);
    });
  });

  describe('Price expiry', () => {
    it('should calculate time remaining correctly', async () => {
      const validUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // +15 minutes
      const mockPriceCalculation = {
        calculationId: 'calc-123',
        basePrice: 2500,
        distance: 500,
        cargoDetails: { type: 'GENERAL', weight: 5, description: 'Test' },
        surcharges: [],
        gstBreakdown: { cgst: 225, sgst: 225, igst: 0 },
        totalPrice: 2950,
        validUntil,
        currency: 'INR',
      };

      mockedApi.calculatePrice.mockResolvedValueOnce(mockPriceCalculation as any);

      const { result } = renderHook(() => usePriceCalculation());

      await act(async () => {
        await result.current.calculatePrice({
          pickupLocation: {
            address: 'Test',
            latitude: 17.385,
            longitude: 78.486,
            pincode: '500001',
          },
          deliveryLocation: {
            address: 'Test',
            latitude: 12.971,
            longitude: 77.594,
            pincode: '560001',
          },
          cargoDetails: { type: 'GENERAL', weight: 5, description: 'Test' },
          pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        });
      });

      // Time remaining should be approximately 15 minutes (900 seconds)
      expect(result.current.timeRemaining).toBeGreaterThan(890);
      expect(result.current.timeRemaining).toBeLessThan(910);
      expect(result.current.isExpired).toBe(false);
    });

    it('should mark price as expired when time runs out', async () => {
      const validUntil = new Date(Date.now() + 2000).toISOString(); // +2 seconds
      const mockPriceCalculation = {
        calculationId: 'calc-123',
        basePrice: 2500,
        distance: 500,
        cargoDetails: { type: 'GENERAL', weight: 5, description: 'Test' },
        surcharges: [],
        gstBreakdown: { cgst: 225, sgst: 225, igst: 0 },
        totalPrice: 2950,
        validUntil,
        currency: 'INR',
      };

      mockedApi.calculatePrice.mockResolvedValueOnce(mockPriceCalculation as any);

      const { result } = renderHook(() => usePriceCalculation());

      await act(async () => {
        await result.current.calculatePrice({
          pickupLocation: {
            address: 'Test',
            latitude: 17.385,
            longitude: 78.486,
            pincode: '500001',
          },
          deliveryLocation: {
            address: 'Test',
            latitude: 12.971,
            longitude: 77.594,
            pincode: '560001',
          },
          cargoDetails: { type: 'GENERAL', weight: 5, description: 'Test' },
          pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        });
      });

      expect(result.current.isExpired).toBe(false);

      // Fast-forward time by 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.error).toContain('Price quote has expired');
    });
  });

  describe('clearPrice', () => {
    it('should clear price calculation and reset state', async () => {
      const mockPriceCalculation = {
        calculationId: 'calc-123',
        basePrice: 2500,
        distance: 500,
        cargoDetails: { type: 'GENERAL', weight: 5, description: 'Test' },
        surcharges: [],
        gstBreakdown: { cgst: 225, sgst: 225, igst: 0 },
        totalPrice: 2950,
        validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        currency: 'INR',
      };

      mockedApi.calculatePrice.mockResolvedValueOnce(mockPriceCalculation as any);

      const { result } = renderHook(() => usePriceCalculation());

      await act(async () => {
        await result.current.calculatePrice({
          pickupLocation: {
            address: 'Test',
            latitude: 17.385,
            longitude: 78.486,
            pincode: '500001',
          },
          deliveryLocation: {
            address: 'Test',
            latitude: 12.971,
            longitude: 77.594,
            pincode: '560001',
          },
          cargoDetails: { type: 'GENERAL', weight: 5, description: 'Test' },
          pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        });
      });

      expect(result.current.priceCalculation).not.toBeNull();

      act(() => {
        result.current.clearPrice();
      });

      expect(result.current.priceCalculation).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.timeRemaining).toBe(0);
    });
  });
});
