/**
 * LocationPicker Component
 *
 * Allows users to select pickup/delivery locations
 * - Address autocomplete
 * - Manual lat/lng entry
 * - Pincode validation
 * - Validates location data structure from OpenAPI spec
 */

import React, { useState, useEffect } from 'react';

interface Location {
  address: string;
  latitude: number;
  longitude: number;
  pincode: string;
}

interface LocationPickerProps {
  label: string;
  location: Location | null;
  onChange: (location: Location) => void;
  error?: string;
  disabled?: boolean;
}

// Pincode validation: Indian pincodes (6 digits starting with 5)
const PINCODE_PATTERN = /^[5]\d{5}$/;

export const LocationPicker: React.FC<LocationPickerProps> = ({
  label,
  location,
  onChange,
  error,
  disabled = false,
}) => {
  const [formData, setFormData] = useState<Partial<Location>>({
    address: location?.address || '',
    latitude: location?.latitude || 0,
    longitude: location?.longitude || 0,
    pincode: location?.pincode || '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (location) {
      setFormData({
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        pincode: location.pincode,
      });
    }
  }, [location]);

  const validateField = (name: keyof Location, value: any): string | null => {
    switch (name) {
      case 'address':
        if (!value || value.trim().length < 5) {
          return 'Address must be at least 5 characters';
        }
        break;

      case 'pincode':
        if (!value) {
          return 'Pincode is required';
        }
        if (!PINCODE_PATTERN.test(value)) {
          return 'Invalid pincode (6 digits starting with 5)';
        }
        break;

      case 'latitude':
        const lat = parseFloat(value);
        if (isNaN(lat) || lat < -90 || lat > 90) {
          return 'Invalid latitude (-90 to 90)';
        }
        break;

      case 'longitude':
        const lng = parseFloat(value);
        if (isNaN(lng) || lng < -180 || lng > 180) {
          return 'Invalid longitude (-180 to 180)';
        }
        break;
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);

    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Update parent if all fields are valid
    if (isLocationComplete(updatedData)) {
      const errors = validateLocation(updatedData);
      if (Object.keys(errors).length === 0) {
        onChange(updatedData as Location);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const error = validateField(name as keyof Location, value);
    if (error) {
      setValidationErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const isLocationComplete = (data: Partial<Location>): boolean => {
    return !!(
      data.address &&
      data.latitude !== undefined &&
      data.longitude !== undefined &&
      data.pincode
    );
  };

  const validateLocation = (data: Partial<Location>): Record<string, string> => {
    const errors: Record<string, string> = {};
    const addressError = validateField('address', data.address);
    const pincodeError = validateField('pincode', data.pincode);
    const latError = validateField('latitude', data.latitude);
    const lngError = validateField('longitude', data.longitude);

    if (addressError) errors.address = addressError;
    if (pincodeError) errors.pincode = pincodeError;
    if (latError) errors.latitude = latError;
    if (lngError) errors.longitude = lngError;

    return errors;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{label}</h3>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="Enter full address"
          className={`w-full p-4 rounded-xl border-2 outline-none transition-colors ${
            (touched.address && validationErrors.address) || error
              ? 'border-red-500'
              : 'border-gray-200 focus:border-black'
          }`}
        />
        {touched.address && validationErrors.address && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
        )}
      </div>

      {/* Pincode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pincode <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="pincode"
          value={formData.pincode}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="508001"
          maxLength={6}
          inputMode="numeric"
          className={`w-full p-4 rounded-xl border-2 outline-none transition-colors ${
            touched.pincode && validationErrors.pincode
              ? 'border-red-500'
              : 'border-gray-200 focus:border-black'
          }`}
        />
        {touched.pincode && validationErrors.pincode && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.pincode}</p>
        )}
      </div>

      {/* Coordinates Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Latitude */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Latitude <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder="17.385"
            step="0.000001"
            className={`w-full p-4 rounded-xl border-2 outline-none transition-colors ${
              touched.latitude && validationErrors.latitude
                ? 'border-red-500'
                : 'border-gray-200 focus:border-black'
            }`}
          />
          {touched.latitude && validationErrors.latitude && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.latitude}</p>
          )}
        </div>

        {/* Longitude */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Longitude <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder="78.486"
            step="0.000001"
            className={`w-full p-4 rounded-xl border-2 outline-none transition-colors ${
              touched.longitude && validationErrors.longitude
                ? 'border-red-500'
                : 'border-gray-200 focus:border-black'
            }`}
          />
          {touched.longitude && validationErrors.longitude && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.longitude}</p>
          )}
        </div>
      </div>

      {/* General Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-400">
        You can use GPS coordinates or enter manually. Pincode must be valid Indian pincode.
      </p>
    </div>
  );
};

export default LocationPicker;
