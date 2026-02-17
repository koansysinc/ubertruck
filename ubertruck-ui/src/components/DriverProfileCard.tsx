/**
 * DriverProfileCard Component
 *
 * Displays driver and vehicle information after booking confirmation
 * Following Uber/Rapido pattern for driver assignment display
 */

import React from 'react';
import type { BookingResponse } from '../types';

interface DriverProfileCardProps {
  booking: BookingResponse;
}

export const DriverProfileCard: React.FC<DriverProfileCardProps> = ({ booking }) => {
  const { driver, vehicle, status } = booking;

  // Handle case-insensitive status
  const normalizedStatus = status?.toLowerCase();

  if (!driver && !vehicle) {
    // Check if booking is completed/delivered
    if (normalizedStatus === 'delivered' || normalizedStatus === 'completed') {
      return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-900 font-medium">Delivery Completed</p>
            <p className="text-sm text-gray-500 mt-1">This booking has been successfully delivered</p>
          </div>
        </div>
      );
    }

    // For non-delivered bookings without driver
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Finding available driver...</p>
          <p className="text-sm text-gray-400 mt-1">We'll assign a driver shortly</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Your Driver</h3>
          <p className="text-sm text-gray-500">Assigned to your booking</p>
        </div>
        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          {status === 'assigned' ? 'Assigned' : status}
        </div>
      </div>

      {/* Driver Info */}
      {driver && (
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          {/* Driver Avatar */}
          <div className="w-16 h-16 bg-gradient-to-br from-black to-gray-700 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {driver.name.charAt(0).toUpperCase()}
          </div>

          {/* Driver Details */}
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-bold text-gray-900 truncate">{driver.name}</h4>
            {driver.phone && (
              <a
                href={`tel:${driver.phone}`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {driver.phone}
              </a>
            )}
          </div>

          {/* Call Button */}
          {driver.phone && (
            <a
              href={`tel:${driver.phone}`}
              className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-all active:scale-95 flex-shrink-0"
              aria-label="Call driver"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* Vehicle Info */}
      {vehicle && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Vehicle Details</h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Registration Number */}
            {vehicle.registration && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Registration No.</p>
                <p className="text-sm font-bold text-gray-900 font-mono">{vehicle.registration}</p>
              </div>
            )}

            {/* Vehicle Type */}
            {vehicle.type && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Truck Type</p>
                <p className="text-sm font-bold text-gray-900">{vehicle.type} Truck</p>
              </div>
            )}
          </div>

          {/* Truck Icon */}
          <div className="mt-4 flex items-center justify-center pt-4 border-t border-gray-100">
            <div className="text-gray-400">
              <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverProfileCard;
