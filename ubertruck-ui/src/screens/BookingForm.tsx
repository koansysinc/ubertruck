/**
 * BookingForm Screen
 *
 * Complete booking creation flow
 * - Step 1: Pickup & Delivery Locations
 * - Step 2: Cargo Details
 * - Step 3: Contact Information
 * - Step 4: Price Calculation & Confirmation
 * - Calls POST /bookings to create booking
 */

import React, { useState, useEffect } from 'react';
import { LocationPicker } from '../components/LocationPicker';
import { CargoDetailsForm } from '../components/CargoDetailsForm';
import { ContactDetailsForm } from '../components/ContactDetailsForm';
import { PriceBreakdown } from '../components/PriceBreakdown';
import { usePriceCalculation } from '../hooks/usePriceCalculation';
import { api } from '../services/api';
import type { Location, CargoDetails, ContactPerson, BookingRequest, BookingResponse } from '../types';

interface BookingFormProps {
  onSuccess: (booking: BookingResponse) => void;
  onCancel: () => void;
}

type Step = 1 | 2 | 3 | 4;

export const BookingForm: React.FC<BookingFormProps> = ({ onSuccess, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<Location | null>(null);
  const [cargoDetails, setCargoDetails] = useState<CargoDetails | null>(null);
  const [pickupContact, setPickupContact] = useState<ContactPerson | null>(null);
  const [deliveryContact, setDeliveryContact] = useState<ContactPerson | null>(null);
  const [pickupTime, setPickupTime] = useState<string>('');

  // Price calculation
  const {
    priceCalculation,
    isCalculating,
    error: priceError,
    calculatePrice,
    clearPrice,
    isExpired,
    timeRemaining,
  } = usePriceCalculation();

  // Clear errors when step changes
  useEffect(() => {
    setError(null);
  }, [currentStep]);

  const canProceedToStep2 = (): boolean => {
    return !!(pickupLocation && deliveryLocation && pickupTime);
  };

  const canProceedToStep3 = (): boolean => {
    return !!(cargoDetails && cargoDetails.weight > 0);
  };

  const canProceedToStep4 = (): boolean => {
    return !!(pickupContact && deliveryContact);
  };

  const handleNextStep = async () => {
    setError(null);

    if (currentStep === 1 && !canProceedToStep2()) {
      setError('Please fill in all location and pickup time details');
      return;
    }

    if (currentStep === 2 && !canProceedToStep3()) {
      setError('Please fill in all cargo details');
      return;
    }

    if (currentStep === 3 && !canProceedToStep4()) {
      setError('Please fill in all contact details');
      return;
    }

    // Calculate price when moving to step 4
    if (currentStep === 3) {
      try {
        await calculatePrice({
          pickupLocation: pickupLocation!,
          deliveryLocation: deliveryLocation!,
          cargoDetails: cargoDetails!,
          pickupTime: pickupTime,
        });
        setCurrentStep(4);
      } catch (err) {
        setError('Failed to calculate price. Please try again.');
      }
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4) as Step);
  };

  const handlePreviousStep = () => {
    if (currentStep === 4) {
      clearPrice();
    }
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
  };

  const handleRecalculatePrice = async () => {
    try {
      await calculatePrice({
        pickupLocation: pickupLocation!,
        deliveryLocation: deliveryLocation!,
        cargoDetails: cargoDetails!,
        pickupTime: pickupTime,
      });
    } catch (err) {
      setError('Failed to recalculate price. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!priceCalculation || isExpired) {
      setError('Price quote has expired. Please recalculate.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const bookingRequest: BookingRequest = {
        pickupLocation: pickupLocation!,
        deliveryLocation: deliveryLocation!,
        cargoDetails: cargoDetails!,
        pickupTime: pickupTime,
        pickupContact: pickupContact!,
        deliveryContact: deliveryContact!,
        priceCalculationId: priceCalculation.calculationId,
      };

      const response = await api.createBooking(bookingRequest);

      // Extract the nested booking object from API response
      // API returns: { success, message, booking: {...} }
      // We need to pass only the booking object with additional UI data
      const bookingData = (response as any).booking || response;

      onSuccess({
        ...bookingData,
        pickupLocation: pickupLocation!,
        deliveryLocation: deliveryLocation!,
        cargoDetails: cargoDetails!,
      } as any);
    } catch (err: any) {
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinPickupTime = (): string => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // Minimum 1 hour in future
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="h-full w-full bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Booking</h1>
              <p className="text-sm text-gray-500">Step {currentStep} of 4</p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 active:scale-95 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition-all ${
                  step <= currentStep ? 'bg-black' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Step 1: Locations */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <LocationPicker
              label="Pickup Location"
              location={pickupLocation}
              onChange={setPickupLocation}
              error={error}
            />

            <LocationPicker
              label="Delivery Location"
              location={deliveryLocation}
              onChange={setDeliveryLocation}
            />

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pickup Time</h3>
              <input
                type="datetime-local"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                min={getMinPickupTime()}
                className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-black outline-none transition-colors"
              />
              <p className="text-xs text-gray-400 mt-2">
                Pickup time must be at least 1 hour in the future
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Cargo Details */}
        {currentStep === 2 && (
          <CargoDetailsForm
            cargoDetails={cargoDetails}
            onChange={setCargoDetails}
            error={error}
          />
        )}

        {/* Step 3: Contact Information */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <ContactDetailsForm
              label="Pickup Contact Person"
              contactPerson={pickupContact}
              onChange={setPickupContact}
              error={error}
            />

            <ContactDetailsForm
              label="Delivery Contact Person"
              contactPerson={deliveryContact}
              onChange={setDeliveryContact}
            />
          </div>
        )}

        {/* Step 4: Price & Confirmation */}
        {currentStep === 4 && (
          <div className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Booking Summary</h3>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Pickup</p>
                  <p className="font-semibold text-gray-900">{pickupLocation?.address}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(pickupTime).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="border-l-4 border-gray-200 pl-4">
                  <p className="text-gray-500">Delivery</p>
                  <p className="font-semibold text-gray-900">{deliveryLocation?.address}</p>
                </div>

                <div>
                  <p className="text-gray-500">Cargo</p>
                  <p className="font-semibold text-gray-900">
                    {cargoDetails?.type} - {cargoDetails?.weight} tonnes
                  </p>
                  <p className="text-xs text-gray-400">{cargoDetails?.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500">Pickup Contact</p>
                    <p className="font-semibold text-gray-900">{pickupContact?.name}</p>
                    <p className="text-xs text-gray-400">{pickupContact?.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Delivery Contact</p>
                    <p className="font-semibold text-gray-900">{deliveryContact?.name}</p>
                    <p className="text-xs text-gray-400">{deliveryContact?.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <PriceBreakdown
              priceCalculation={priceCalculation}
              isExpired={isExpired}
              timeRemaining={timeRemaining}
              onRecalculate={handleRecalculatePrice}
            />
          </div>
        )}

        {/* Error Message */}
        {error && currentStep !== 4 && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mt-6 flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {priceError && currentStep === 4 && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mt-6 flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{priceError}</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8 sticky bottom-0 bg-gray-50 py-4">
          {currentStep > 1 && (
            <button
              onClick={handlePreviousStep}
              disabled={isCalculating || isSubmitting}
              className="flex-1 py-4 rounded-xl font-bold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
          )}

          {currentStep < 4 ? (
            <button
              onClick={handleNextStep}
              disabled={isCalculating}
              className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                isCalculating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white active:scale-95'
              }`}
            >
              {currentStep === 3 && isCalculating ? 'Calculating Price...' : 'Next'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isExpired || !priceCalculation}
              className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                isSubmitting || isExpired || !priceCalculation
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white active:scale-95 hover:bg-green-700'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Booking...
                </span>
              ) : (
                'Confirm & Create Booking'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
