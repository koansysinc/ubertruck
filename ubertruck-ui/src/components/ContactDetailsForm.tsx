/**
 * ContactDetailsForm Component
 *
 * Collects contact person details for pickup and delivery
 * - Name validation
 * - Phone number validation (Indian format)
 * - Validates against OpenAPI spec ContactPerson type
 */

import React, { useState, useEffect } from 'react';
import type { ContactPerson } from '../types';

interface ContactDetailsFormProps {
  label: string;
  contactPerson: ContactPerson | null;
  onChange: (contact: ContactPerson) => void;
  error?: string | null;
  disabled?: boolean;
}

// Phone validation: Indian numbers (10 digits starting with 6-9)
const PHONE_PATTERN = /^[6-9]\d{9}$/;

export const ContactDetailsForm: React.FC<ContactDetailsFormProps> = ({
  label,
  contactPerson,
  onChange,
  error,
  disabled = false,
}) => {
  const [formData, setFormData] = useState<Partial<ContactPerson>>({
    name: contactPerson?.name || '',
    phone: contactPerson?.phone || '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contactPerson) {
      setFormData({
        name: contactPerson.name,
        phone: contactPerson.phone,
      });
    }
  }, [contactPerson]);

  const validateField = (name: keyof ContactPerson, value: any): string | null => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length < 2) {
          return 'Name must be at least 2 characters';
        }
        if (value.length > 100) {
          return 'Name must not exceed 100 characters';
        }
        if (!/^[a-zA-Z\s]+$/.test(value)) {
          return 'Name can only contain letters and spaces';
        }
        break;

      case 'phone':
        if (!value) {
          return 'Phone number is required';
        }
        // Remove +91 prefix if present for validation
        const cleanPhone = value.replace(/^\+91/, '');
        if (!PHONE_PATTERN.test(cleanPhone)) {
          return 'Invalid phone number (10 digits starting with 6-9)';
        }
        break;
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Auto-format phone number (remove non-digits, limit to 10)
    let processedValue = value;
    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    const updatedData = { ...formData, [name]: processedValue };
    setFormData(updatedData);

    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Update parent if all fields are valid
    if (isContactComplete(updatedData)) {
      const errors = validateContact(updatedData);
      if (Object.keys(errors).length === 0) {
        // Add +91 prefix to phone before passing to parent
        const contactWithPrefix = {
          ...updatedData,
          phone: `+91${updatedData.phone}`,
          phoneNumber: `+91${updatedData.phone}`,
        } as ContactPerson;
        onChange(contactWithPrefix);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const error = validateField(name as keyof ContactPerson, value);
    if (error) {
      setValidationErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const isContactComplete = (data: Partial<ContactPerson>): boolean => {
    return !!(data.name && data.phone);
  };

  const validateContact = (data: Partial<ContactPerson>): Record<string, string> => {
    const errors: Record<string, string> = {};
    const nameError = validateField('name', data.name);
    const phoneError = validateField('phone', data.phone);

    if (nameError) errors.name = nameError;
    if (phoneError) errors.phone = phoneError;

    return errors;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{label}</h3>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="Enter full name"
          maxLength={100}
          className={`w-full p-4 rounded-xl border-2 outline-none transition-colors ${
            (touched.name && validationErrors.name) || error
              ? 'border-red-500'
              : 'border-gray-200 focus:border-black'
          }`}
        />
        {touched.name && validationErrors.name && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <div className={`flex items-center gap-3 bg-gray-100 p-4 rounded-xl border-2 transition-colors ${
          (touched.phone && validationErrors.phone) || error
            ? 'border-red-500'
            : 'border-transparent focus-within:border-black'
        }`}>
          <span className="font-bold border-r border-gray-300 pr-3">🇮🇳 +91</span>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder="9876543210"
            maxLength={10}
            inputMode="numeric"
            className="bg-transparent outline-none w-full text-lg"
          />
        </div>
        {touched.phone && validationErrors.phone && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          10-digit number starting with 6, 7, 8, or 9
        </p>
      </div>

      {/* General Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default ContactDetailsForm;
