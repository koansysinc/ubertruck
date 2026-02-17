/**
 * BookingDetails Screen
 *
 * Displays complete booking information including:
 * - Driver and vehicle details
 * - Pickup/delivery locations
 * - Status timeline
 * - Pricing breakdown
 */

import React from 'react';
import { DriverProfileCard } from '../components/DriverProfileCard';
import type { BookingResponse } from '../types';

interface BookingDetailsProps {
  booking: BookingResponse;
  onClose: () => void;
}

export const BookingDetails: React.FC<BookingDetailsProps> = ({ booking, onClose }) => {
  // LOG EXACT BOOKING RESPONSE RECEIVED
  console.log('[BookingDetails] Received booking object:', JSON.stringify(booking, null, 2));
  console.log('[BookingDetails] Driver details:', booking.driver);
  console.log('[BookingDetails] Vehicle details:', booking.vehicle);

  const getStatusIcon = (status: string) => {
    if (!status) return null;
    const statusLower = status.toLowerCase();
    if (statusLower.includes('created')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (statusLower.includes('assigned')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-sm text-gray-500">#{booking.bookingNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 active:scale-95 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-green-900 mb-1">
                {booking.status?.toLowerCase() === 'delivered' ? 'Booking Delivered!' : 'Booking Confirmed!'}
              </h2>
              <p className="text-green-700">
                {(() => {
                  const statusLower = booking.status?.toLowerCase();
                  if (statusLower === 'delivered' || statusLower === 'completed') {
                    return 'Your shipment has been successfully delivered.';
                  } else if (booking.driver) {
                    return 'A driver has been assigned to your shipment.';
                  } else {
                    return 'We are finding an available driver for you.';
                  }
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* Driver Profile Card */}
        <DriverProfileCard booking={booking} />

        {/* Trip Details */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Trip Details</h3>

          <div className="space-y-4">
            {/* Pickup Location */}
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                A
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pickup Location</p>
                <p className="text-sm font-medium text-gray-900">
                  {typeof booking.pickupLocation === 'string'
                    ? booking.pickupLocation
                    : booking.pickupLocation?.address || 'Not specified'}
                </p>
                {booking.pickupDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(booking.pickupDate)}
                  </p>
                )}
              </div>
            </div>

            {/* Dotted Line */}
            <div className="ml-5 border-l-2 border-dashed border-gray-300 h-8"></div>

            {/* Delivery Location */}
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                B
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Delivery Location</p>
                <p className="text-sm font-medium text-gray-900">
                  {typeof booking.deliveryLocation === 'string'
                    ? booking.deliveryLocation
                    : booking.deliveryLocation?.address || 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Cargo Info */}
          {booking.cargoWeight && (
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Cargo Weight</p>
                <p className="text-sm font-bold text-gray-900">{booking.cargoWeight} tonnes</p>
              </div>
              {booking.distance && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Distance</p>
                  <p className="text-sm font-bold text-gray-900">{booking.distance.toFixed(1)} km</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pricing Breakdown */}
        {booking.totalPrice && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pricing Details</h3>

            <div className="space-y-3">
              {booking.basePrice && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Price</span>
                  <span className="font-medium text-gray-900">{formatCurrency(booking.basePrice)}</span>
                </div>
              )}

              {booking.gstAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium text-gray-900">{formatCurrency(booking.gstAmount)}</span>
                </div>
              )}

              <div className="pt-3 border-t-2 border-gray-200 flex justify-between">
                <span className="font-bold text-gray-900">Total Amount</span>
                <span className="font-bold text-black text-lg">{formatCurrency(booking.totalPrice)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Status Timeline</h3>

          <div className="space-y-4">
            {(() => {
              const statusLower = booking.status?.toLowerCase();
              const statuses = [
                { key: 'created', label: 'Booking Created', icon: '📝' },
                { key: 'assigned', label: 'Driver Assigned', icon: '👤' },
                { key: 'pickup_started', label: 'Pickup Started', icon: '📦' },
                { key: 'in_transit', label: 'In Transit', icon: '🚚' },
                { key: 'delivered', label: 'Delivered', icon: '✅' }
              ];

              // Determine which statuses are completed
              const statusOrder = ['created', 'assigned', 'pickup_started', 'in_transit', 'delivered'];
              const currentIndex = statusOrder.indexOf(statusLower);

              return statuses.map((status, index) => {
                const isCompleted = currentIndex >= statusOrder.indexOf(status.key);
                const isCurrent = statusLower === status.key;

                return (
                  <div key={status.key}>
                    <div className={`flex gap-4 items-start ${!isCompleted ? 'opacity-50' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? (isCurrent ? 'bg-black text-white' : 'bg-green-500 text-white') : 'bg-gray-200'
                      }`}>
                        {isCompleted ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                          {status.label}
                        </p>
                        <p className="text-xs text-gray-400">
                          {isCompleted ? (isCurrent ? 'Current Status' : 'Completed') : 'Pending'}
                        </p>
                      </div>
                    </div>
                    {index < statuses.length - 1 && (
                      <div className={`ml-5 border-l-2 border-gray-300 h-8 ${!isCompleted ? 'border-dashed opacity-50' : 'border-solid'}`}></div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white text-black font-bold rounded-xl border-2 border-black hover:bg-gray-50 transition-all active:scale-95"
          >
            Back to Dashboard
          </button>
          {booking.driver?.phone && (
            <a
              href={`tel:${booking.driver.phone}`}
              className="flex-1 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95 text-center"
            >
              Call Driver
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
