/**
 * LocationPicker Component (Updated with Uber-like Search)
 *
 * Now uses Google Places Autocomplete for easy location selection
 * - No more manual lat/lng entry
 * - Current location (GPS) support
 * - Recent searches
 * - Search as you type
 * - Mobile-optimized
 */

import React from 'react';
import { LocationSearchInput } from './LocationSearchInput';
import type { Location } from '../types';

interface LocationPickerProps {
  label: string;
  location: Location | null;
  onChange: (location: Location) => void;
  error?: string | null;
  disabled?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  label,
  location,
  onChange,
  error,
  disabled = false,
}) => {
  // Convert the new Location type to match the expected format
  const handleLocationChange = (newLocation: { lat: number; lng: number; address: string; pincode: string; city?: string; state?: string }) => {
    // Map to old Location type for compatibility
    onChange({
      address: newLocation.address,
      lat: newLocation.lat,
      lng: newLocation.lng,
      latitude: newLocation.lat,   // Add latitude for backward compatibility
      longitude: newLocation.lng,   // Add longitude for backward compatibility
      pincode: newLocation.pincode,
      city: newLocation.city,
      state: newLocation.state,
    } as Location);
  };

  // If disabled, show read-only display
  if (disabled && location) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-sm font-medium text-gray-900">{location.address}</p>
          {location.pincode && (
            <p className="text-xs text-gray-600 mt-1">
              Pincode: {location.pincode} • {location.city}, {location.state}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <LocationSearchInput
        label={label}
        value={location ? {
          lat: location.lat || location.latitude || 0,
          lng: location.lng || location.longitude || 0,
          address: location.address || '',
          pincode: location.pincode || '',
          city: location.city,
          state: location.state,
        } : null}
        onChange={handleLocationChange}
        error={error || undefined}
        required
      />
    </div>
  );
};

export default LocationPicker;
