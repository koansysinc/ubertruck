/**
 * LocationSearchInput Component
 *
 * Uber-like location search with:
 * - Google Places Autocomplete
 * - Current location (GPS)
 * - Recent searches
 * - Keyboard navigation
 * - Mobile-optimized UX
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { useDebouncedCallback } from 'use-debounce';

// Google Maps API libraries to load
const libraries: ("places")[] = ["places"];

interface Location {
  lat: number;
  lng: number;
  address: string;
  pincode: string;
  city?: string;
  state?: string;
  landmark?: string;
}

interface LocationSearchInputProps {
  label: string;
  placeholder?: string;
  value?: Location | null;
  onChange: (location: Location) => void;
  error?: string;
  required?: boolean;
}

// Helper: Extract pincode from address components
const extractPincode = (addressComponents: google.maps.GeocoderAddressComponent[]): string => {
  const postalCode = addressComponents.find(component =>
    component.types.includes('postal_code')
  );
  return postalCode?.long_name || '';
};

// Helper: Extract city
const extractCity = (addressComponents: google.maps.GeocoderAddressComponent[]): string => {
  const locality = addressComponents.find(component =>
    component.types.includes('locality') || component.types.includes('administrative_area_level_2')
  );
  return locality?.long_name || '';
};

// Helper: Extract state
const extractState = (addressComponents: google.maps.GeocoderAddressComponent[]): string => {
  const state = addressComponents.find(component =>
    component.types.includes('administrative_area_level_1')
  );
  return state?.long_name || '';
};

// Helper: Save to recent searches
const saveRecentSearch = (location: Location) => {
  try {
    const recent = JSON.parse(localStorage.getItem('ubertruck_recent_locations') || '[]');
    const updated = [
      location,
      ...recent.filter((loc: Location) => loc.address !== location.address)
    ].slice(0, 5); // Keep only last 5
    localStorage.setItem('ubertruck_recent_locations', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recent search:', error);
  }
};

// Helper: Get recent searches
const getRecentSearches = (): Location[] => {
  try {
    return JSON.parse(localStorage.getItem('ubertruck_recent_locations') || '[]');
  } catch {
    return [];
  }
};

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  label,
  placeholder = 'Search for area, street name...',
  value,
  onChange,
  error,
  required = false,
}) => {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value?.address || '');
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Location[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    if (value?.address) {
      setInputValue(value.address);
    }
  }, [value]);

  // Handle autocomplete load
  const onLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);

    // Restrict to India
    autocompleteInstance.setComponentRestrictions({ country: 'in' });

    // Specify fields to reduce API cost
    autocompleteInstance.setFields([
      'address_components',
      'formatted_address',
      'geometry',
      'name'
    ]);
  }, []);

  // Handle place selection from autocomplete
  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace();

      if (place.geometry?.location && place.address_components) {
        const location: Location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address || '',
          pincode: extractPincode(place.address_components),
          city: extractCity(place.address_components),
          state: extractState(place.address_components),
          landmark: place.name !== place.formatted_address ? place.name : undefined,
        };

        setInputValue(location.address);
        saveRecentSearch(location);
        onChange(location);
        setShowRecentSearches(false);
      }
    }
  }, [autocomplete, onChange]);

  // Get current location using GPS
  const handleGetCurrentLocation = useCallback(() => {
    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            setIsGettingLocation(false);

            if (status === 'OK' && results && results[0]) {
              const result = results[0];
              const location: Location = {
                lat: latitude,
                lng: longitude,
                address: result.formatted_address,
                pincode: extractPincode(result.address_components),
                city: extractCity(result.address_components),
                state: extractState(result.address_components),
              };

              setInputValue(location.address);
              saveRecentSearch(location);
              onChange(location);
            } else {
              console.error('[LocationSearchInput] Geocoding error - Status:', status);
              alert('Unable to get address for your location');
            }
          }
        );
      },
      (error) => {
        setIsGettingLocation(false);
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please check your browser permissions.');
      }
    );
  }, [onChange]);

  // Handle recent search selection
  const handleRecentSearchClick = (location: Location) => {
    setInputValue(location.address);
    onChange(location);
    setShowRecentSearches(false);
  };

  // Handle input focus
  const handleFocus = () => {
    if (recentSearches.length > 0 && !inputValue) {
      setShowRecentSearches(true);
    }
  };

  // Handle input blur (with delay to allow click on recent searches)
  const handleBlur = () => {
    setTimeout(() => setShowRecentSearches(false), 200);
  };

  // Show loading state
  if (loadError) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ⚠️ Failed to load Google Maps. Please check your API key.
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
          <span className="text-sm text-gray-600">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 relative">
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Current Location Button */}
      <button
        type="button"
        onClick={handleGetCurrentLocation}
        disabled={isGettingLocation}
        className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all rounded-xl text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGettingLocation ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-blue-700 border-t-transparent rounded-full"></div>
            <span>Getting your location...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Use Current Location</span>
          </>
        )}
      </button>

      {/* Search Input with Autocomplete */}
      <div className="relative">
        <Autocomplete
          onLoad={onLoad}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`w-full px-4 py-3 pl-12 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-black focus:ring-black/10'
            }`}
          />
        </Autocomplete>

        {/* Search Icon */}
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Recent Searches Dropdown */}
      {showRecentSearches && recentSearches.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Recent Searches</p>
          </div>
          {recentSearches.map((location, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleRecentSearchClick(location)}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{location.city || location.address.split(',')[0]}</p>
                <p className="text-xs text-gray-500 truncate">{location.address}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Selected Location Preview */}
      {value && !error && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-900">Location selected</p>
              <p className="text-xs text-green-700 mt-1">{value.address}</p>
              {value.pincode && (
                <p className="text-xs text-green-600 mt-1">
                  Pincode: {value.pincode} • {value.city}, {value.state}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Helper Text */}
      {!value && !error && (
        <p className="mt-2 text-xs text-gray-500">
          💡 Tip: Use current location or search for area, landmark, or address
        </p>
      )}
    </div>
  );
};

export default LocationSearchInput;
