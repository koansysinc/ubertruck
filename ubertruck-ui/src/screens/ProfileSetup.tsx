/**
 * ProfileSetup Screen
 *
 * Optional third step for new users
 * - Collect business name
 * - Collect address (optional)
 * - Collect GST number (optional)
 * - Calls PUT /users/profile
 */

import React, { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';

interface ProfileSetupProps {
  onComplete: () => void;
  onSkip: () => void;
}

const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, onSkip }) => {
  const { updateProfile, isLoading, error, clearError } = useAuthContext();
  const [formData, setFormData] = useState({
    businessName: '',
    gstNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear errors when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) {
      clearError();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate on blur
    validateField(name);
  };

  const validateField = (name: string) => {
    const value = formData[name as keyof typeof formData];

    switch (name) {
      case 'businessName':
        if (value && value.length < 3) {
          setErrors(prev => ({
            ...prev,
            businessName: 'Business name must be at least 3 characters',
          }));
        }
        break;

      case 'gstNumber':
        if (value && !GST_PATTERN.test(value)) {
          setErrors(prev => ({
            ...prev,
            gstNumber: 'Invalid GST number format (e.g., 27AABCC1234A1Z5)',
          }));
        }
        break;

      case 'pincode':
        if (value && !/^[5]\d{5}$/.test(value)) {
          setErrors(prev => ({
            ...prev,
            pincode: 'Invalid pincode (must be 6 digits starting with 5)',
          }));
        }
        break;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.businessName && formData.businessName.length < 3) {
      newErrors.businessName = 'Business name must be at least 3 characters';
    }

    if (formData.gstNumber && !GST_PATTERN.test(formData.gstNumber)) {
      newErrors.gstNumber = 'Invalid GST number format';
    }

    if (formData.pincode && !/^[5]\d{5}$/.test(formData.pincode)) {
      newErrors.pincode = 'Invalid pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched
    setTouched({
      businessName: true,
      gstNumber: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
    });

    // Validate
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare profile data
      const profileData: any = {};

      if (formData.businessName) {
        profileData.businessName = formData.businessName;
      }

      if (formData.gstNumber) {
        profileData.gstNumber = formData.gstNumber;
      }

      if (formData.address || formData.city || formData.state || formData.pincode) {
        profileData.address = {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        };
      }

      // Update profile
      await updateProfile(profileData);

      // Navigate to dashboard
      onComplete();
    } catch (err) {
      console.error('Profile update error:', err);
    }
  };

  return (
    <div className="h-full w-full bg-white p-6 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="mt-8 mb-8">
        <h2 className="text-3xl font-bold mb-2">Complete your profile</h2>
        <p className="text-gray-500">Help us serve you better (optional)</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1">
        {/* Business Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name
          </label>
          <input
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            placeholder="Enter your business name"
            className={`w-full p-4 rounded-xl border-2 outline-none transition-colors ${
              touched.businessName && errors.businessName
                ? 'border-red-500'
                : 'border-gray-200 focus:border-black'
            }`}
          />
          {touched.businessName && errors.businessName && (
            <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>
          )}
        </div>

        {/* GST Number */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GST Number <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            type="text"
            name="gstNumber"
            value={formData.gstNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            placeholder="27AABCC1234A1Z5"
            maxLength={15}
            className={`w-full p-4 rounded-xl border-2 outline-none transition-colors uppercase ${
              touched.gstNumber && errors.gstNumber
                ? 'border-red-500'
                : 'border-gray-200 focus:border-black'
            }`}
          />
          {touched.gstNumber && errors.gstNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.gstNumber}</p>
          )}
        </div>

        {/* Address */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            placeholder="Street address"
            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-black outline-none transition-colors"
          />
        </div>

        {/* City & State */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="City"
              className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-black outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="State"
              className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-black outline-none transition-colors"
            />
          </div>
        </div>

        {/* Pincode */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            placeholder="508001"
            maxLength={6}
            inputMode="numeric"
            className={`w-full p-4 rounded-xl border-2 outline-none transition-colors ${
              touched.pincode && errors.pincode
                ? 'border-red-500'
                : 'border-gray-200 focus:border-black'
            }`}
          />
          {touched.pincode && errors.pincode && (
            <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold transition-all ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white active:scale-95'
            }`}
          >
            {isLoading ? 'Saving...' : 'Save Profile'}
          </button>

          <button
            type="button"
            onClick={onSkip}
            disabled={isLoading}
            className="w-full py-4 rounded-xl font-bold text-gray-600 hover:bg-gray-100 active:scale-95 transition-all"
          >
            Skip for now
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSetup;
