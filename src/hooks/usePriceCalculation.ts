/**
 * usePriceCalculation Hook
 *
 * Handles dynamic price calculation for bookings
 * - Calls POST /payments/calculate
 * - Caches price for validity period
 * - Provides price breakdown (base + surcharges + GST)
 * - Validates price expiry
 */

import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import type { PriceCalculation, Location, CargoDetails } from '../types';

interface PriceCalculationRequest {
  pickupLocation: Location;
  deliveryLocation: Location;
  cargoDetails: CargoDetails;
  pickupTime: string; // ISO 8601 datetime
}

interface UsePriceCalculationReturn {
  priceCalculation: PriceCalculation | null;
  isCalculating: boolean;
  error: string | null;
  calculatePrice: (request: PriceCalculationRequest) => Promise<PriceCalculation>;
  clearPrice: () => void;
  isExpired: boolean;
  timeRemaining: number; // seconds until expiry
}

/**
 * Hook for managing price calculations
 *
 * @example
 * ```tsx
 * const { priceCalculation, isCalculating, calculatePrice } = usePriceCalculation();
 *
 * const handleCalculate = async () => {
 *   const price = await calculatePrice({
 *     pickupLocation,
 *     deliveryLocation,
 *     cargoDetails,
 *     pickupTime: new Date().toISOString(),
 *   });
 *   console.log('Base price:', price.basePrice);
 *   console.log('Total:', price.totalPrice);
 * };
 * ```
 */
export const usePriceCalculation = (): UsePriceCalculationReturn => {
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Check if price has expired
  const isExpired = useCallback((): boolean => {
    if (!priceCalculation?.validUntil) return true;

    const validUntil = new Date(priceCalculation.validUntil).getTime();
    const now = Date.now();
    return now >= validUntil;
  }, [priceCalculation]);

  // Update time remaining every second
  useEffect(() => {
    if (!priceCalculation?.validUntil) {
      setTimeRemaining(0);
      return;
    }

    const updateTimeRemaining = () => {
      const validUntil = new Date(priceCalculation.validUntil!).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((validUntil - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setError('Price quote has expired. Please recalculate.');
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [priceCalculation]);

  /**
   * Calculate price for a booking
   */
  const calculatePrice = useCallback(async (
    request: PriceCalculationRequest
  ): Promise<PriceCalculation> => {
    setIsCalculating(true);
    setError(null);

    try {
      // Validate request
      if (!request.pickupLocation || !request.deliveryLocation) {
        throw new Error('Pickup and delivery locations are required');
      }

      if (!request.cargoDetails) {
        throw new Error('Cargo details are required');
      }

      if (!request.pickupTime) {
        throw new Error('Pickup time is required');
      }

      // Validate pickup time is in the future (at least 1 hour)
      const pickupDate = new Date(request.pickupTime);
      const minPickupTime = new Date(Date.now() + 60 * 60 * 1000); // +1 hour
      if (pickupDate < minPickupTime) {
        throw new Error('Pickup time must be at least 1 hour in the future');
      }

      // Call API
      const calculation = await api.calculatePrice({
        pickupLocation: request.pickupLocation,
        deliveryLocation: request.deliveryLocation,
        cargoDetails: request.cargoDetails,
        pickupTime: request.pickupTime,
      });

      setPriceCalculation(calculation);
      return calculation;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to calculate price';
      setError(errorMessage);
      throw err;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  /**
   * Clear current price calculation
   */
  const clearPrice = useCallback(() => {
    setPriceCalculation(null);
    setError(null);
    setTimeRemaining(0);
  }, []);

  return {
    priceCalculation,
    isCalculating,
    error,
    calculatePrice,
    clearPrice,
    isExpired: isExpired(),
    timeRemaining,
  };
};
