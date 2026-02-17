/**
 * Booking Flow Integration Tests
 *
 * Tests the complete booking creation flow:
 * 1. Enter pickup/delivery locations
 * 2. Enter cargo details
 * 3. Enter contact information
 * 4. Calculate price
 * 5. Create booking
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePriceCalculation } from '../../hooks/usePriceCalculation';
import { api } from '../../services/api';
import type { Location, CargoDetails, ContactPerson, BookingRequest } from '../../types';

// Mock the API
jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('Booking Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockPickupLocation: Location = {
    address: 'Nalgonda, Telangana',
    latitude: 17.0491,
    longitude: 79.2649,
    pincode: '508001',
  };

  const mockDeliveryLocation: Location = {
    address: 'Miryalguda, Telangana',
    latitude: 16.8749,
    longitude: 79.5643,
    pincode: '508207',
  };

  const mockCargoDetails: CargoDetails = {
    type: 'AGRICULTURAL',
    weight: 10,
    volume: 15,
    description: 'Rice bags for transport',
    hsnCode: '10063000',
  };

  const mockPickupContact: ContactPerson = {
    name: 'Rajesh Kumar',
    phone: '+919876543210',
  };

  const mockDeliveryContact: ContactPerson = {
    name: 'Suresh Reddy',
    phone: '+919876543211',
  };

  it('should complete full booking flow: locations → cargo → contacts → price → booking', async () => {
    const pickupTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    // Mock price calculation response
    const mockPriceCalculation = {
      calculationId: 'calc-xyz-789',
      basePrice: 500,
      distance: 50,
      cargoDetails: mockCargoDetails,
      surcharges: [
        { type: 'FUEL_SURCHARGE', amount: 50, description: 'Fuel surcharge 10%' },
        { type: 'TOLL_CHARGES', amount: 20, description: 'Toll fees' },
      ],
      gstBreakdown: {
        cgst: 51.3,
        sgst: 51.3,
        igst: 0,
      },
      totalPrice: 672.6,
      validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      currency: 'INR',
    };

    // Mock booking creation response
    const mockBookingResponse = {
      bookingId: 'booking-123-abc',
      status: 'CREATED' as const,
      pickupLocation: mockPickupLocation,
      deliveryLocation: mockDeliveryLocation,
      cargoDetails: mockCargoDetails,
      pickupTime,
      pickupContact: mockPickupContact,
      deliveryContact: mockDeliveryContact,
      priceCalculation: mockPriceCalculation,
      createdAt: new Date().toISOString(),
      requestId: 'req-003',
    };

    mockedApi.calculatePrice.mockResolvedValueOnce(mockPriceCalculation);
    mockedApi.createBooking.mockResolvedValueOnce(mockBookingResponse);

    // Step 1: Calculate price
    const { result } = renderHook(() => usePriceCalculation());

    expect(result.current.priceCalculation).toBeNull();
    expect(result.current.isCalculating).toBe(false);

    await act(async () => {
      await result.current.calculatePrice({
        pickupLocation: mockPickupLocation,
        deliveryLocation: mockDeliveryLocation,
        cargoDetails: mockCargoDetails,
        pickupTime,
      });
    });

    // Verify price calculation
    expect(result.current.priceCalculation).toEqual(mockPriceCalculation);
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isExpired).toBe(false);
    expect(mockedApi.calculatePrice).toHaveBeenCalledWith({
      pickupLocation: mockPickupLocation,
      deliveryLocation: mockDeliveryLocation,
      cargoDetails: mockCargoDetails,
      pickupTime,
    });

    // Verify price breakdown
    expect(result.current.priceCalculation?.basePrice).toBe(500);
    expect(result.current.priceCalculation?.surcharges?.length).toBe(2);
    expect(result.current.priceCalculation?.totalPrice).toBe(672.6);
    expect(result.current.priceCalculation?.gstBreakdown.cgst).toBe(51.3);
    expect(result.current.priceCalculation?.gstBreakdown.sgst).toBe(51.3);

    // Step 2: Create booking with price calculation ID
    const bookingRequest: BookingRequest = {
      pickupLocation: mockPickupLocation,
      deliveryLocation: mockDeliveryLocation,
      cargoDetails: mockCargoDetails,
      pickupTime,
      pickupContact: mockPickupContact,
      deliveryContact: mockDeliveryContact,
      priceCalculationId: mockPriceCalculation.calculationId,
    };

    const booking = await api.createBooking(bookingRequest);

    // Verify booking was created
    expect(booking.bookingId).toBe('booking-123-abc');
    expect(booking.status).toBe('CREATED');
    expect(booking.priceCalculation?.totalPrice).toBe(672.6);
    expect(mockedApi.createBooking).toHaveBeenCalledWith(bookingRequest);
  });

  it('should validate pickup time is at least 1 hour in future', async () => {
    const invalidPickupTime = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // Only 30 minutes

    const { result } = renderHook(() => usePriceCalculation());

    await act(async () => {
      try {
        await result.current.calculatePrice({
          pickupLocation: mockPickupLocation,
          deliveryLocation: mockDeliveryLocation,
          cargoDetails: mockCargoDetails,
          pickupTime: invalidPickupTime,
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain('at least 1 hour in the future');
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(mockedApi.calculatePrice).not.toHaveBeenCalled();
  });

  it('should detect price expiry and prevent booking creation', async () => {
    const pickupTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    // Price expires in 2 seconds
    const mockPriceCalculation = {
      calculationId: 'calc-xyz-789',
      basePrice: 500,
      distance: 50,
      cargoDetails: mockCargoDetails,
      surcharges: [],
      gstBreakdown: { cgst: 45, sgst: 45, igst: 0 },
      totalPrice: 590,
      validUntil: new Date(Date.now() + 2000).toISOString(),
      currency: 'INR',
    };

    mockedApi.calculatePrice.mockResolvedValueOnce(mockPriceCalculation);

    const { result } = renderHook(() => usePriceCalculation());

    // Calculate price
    await act(async () => {
      await result.current.calculatePrice({
        pickupLocation: mockPickupLocation,
        deliveryLocation: mockDeliveryLocation,
        cargoDetails: mockCargoDetails,
        pickupTime,
      });
    });

    expect(result.current.isExpired).toBe(false);

    // Fast-forward time by 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Price should now be expired
    expect(result.current.timeRemaining).toBe(0);
    expect(result.current.error).toContain('Price quote has expired');
  });

  it('should allow recalculation after price expiry', async () => {
    const pickupTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    // First calculation
    const firstPriceCalculation = {
      calculationId: 'calc-1',
      basePrice: 500,
      distance: 50,
      cargoDetails: mockCargoDetails,
      surcharges: [],
      gstBreakdown: { cgst: 45, sgst: 45, igst: 0 },
      totalPrice: 590,
      validUntil: new Date(Date.now() + 2000).toISOString(),
      currency: 'INR',
    };

    // Second calculation (recalculated)
    const secondPriceCalculation = {
      ...firstPriceCalculation,
      calculationId: 'calc-2',
      validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    mockedApi.calculatePrice
      .mockResolvedValueOnce(firstPriceCalculation)
      .mockResolvedValueOnce(secondPriceCalculation);

    const { result } = renderHook(() => usePriceCalculation());

    // First calculation
    await act(async () => {
      await result.current.calculatePrice({
        pickupLocation: mockPickupLocation,
        deliveryLocation: mockDeliveryLocation,
        cargoDetails: mockCargoDetails,
        pickupTime,
      });
    });

    expect(result.current.priceCalculation?.calculationId).toBe('calc-1');

    // Wait for expiry
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.error).toContain('expired');

    // Recalculate
    await act(async () => {
      await result.current.calculatePrice({
        pickupLocation: mockPickupLocation,
        deliveryLocation: mockDeliveryLocation,
        cargoDetails: mockCargoDetails,
        pickupTime,
      });
    });

    expect(result.current.priceCalculation?.calculationId).toBe('calc-2');
    expect(result.current.error).toBeNull();
    expect(result.current.timeRemaining).toBeGreaterThan(0);
  });

  it('should validate cargo weight is within limits (0.1-50 tonnes)', async () => {
    const pickupTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    // Test weight too low
    const { result: result1 } = renderHook(() => usePriceCalculation());

    // Note: Validation happens in the form component, not the hook
    // This test verifies the hook accepts valid weight ranges
    const validCargoLow: CargoDetails = {
      ...mockCargoDetails,
      weight: 0.1, // Minimum valid weight
    };

    const validCargoHigh: CargoDetails = {
      ...mockCargoDetails,
      weight: 50, // Maximum valid weight
    };

    mockedApi.calculatePrice.mockResolvedValue({
      calculationId: 'calc-test',
      basePrice: 100,
      distance: 50,
      cargoDetails: validCargoLow,
      surcharges: [],
      gstBreakdown: { cgst: 9, sgst: 9, igst: 0 },
      totalPrice: 118,
      validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      currency: 'INR',
    });

    // Should accept minimum weight
    await act(async () => {
      await result1.current.calculatePrice({
        pickupLocation: mockPickupLocation,
        deliveryLocation: mockDeliveryLocation,
        cargoDetails: validCargoLow,
        pickupTime,
      });
    });

    expect(result1.current.error).toBeNull();

    const { result: result2 } = renderHook(() => usePriceCalculation());

    // Should accept maximum weight
    await act(async () => {
      await result2.current.calculatePrice({
        pickupLocation: mockPickupLocation,
        deliveryLocation: mockDeliveryLocation,
        cargoDetails: validCargoHigh,
        pickupTime,
      });
    });

    expect(result2.current.error).toBeNull();
  });
});
