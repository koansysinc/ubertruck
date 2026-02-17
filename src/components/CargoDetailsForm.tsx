/**
 * CargoDetailsForm Component
 *
 * Collects cargo/shipment details
 * - Cargo type selection
 * - Weight validation (0.1-50 tonnes)
 * - Volume (optional)
 * - Description
 * - HSN code (optional, for customs)
 * - Validates against OpenAPI spec
 */

import React, { useState, useEffect } from 'react';

interface CargoDetails {
  type: string;
  weight: number;
  volume?: number;
  description: string;
  hsnCode?: string;
}

interface CargoDetailsFormProps {
  cargoDetails: CargoDetails | null;
  onChange: (details: CargoDetails) => void;
  error?: string;
  disabled?: boolean;
}

const CARGO_TYPES = [
  { value: 'GENERAL', label: 'General Cargo' },
  { value: 'PERISHABLE', label: 'Perishable Goods' },
  { value: 'FRAGILE', label: 'Fragile Items' },
  { value: 'HAZARDOUS', label: 'Hazardous Materials' },
  { value: 'AGRICULTURAL', label: 'Agricultural Products' },
  { value: 'CONSTRUCTION', label: 'Construction Materials' },
  { value: 'INDUSTRIAL', label: 'Industrial Equipment' },
];

// Weight validation: 0.1 to 50 tonnes (100 kg to 50000 kg)
const MIN_WEIGHT = 0.1;
const MAX_WEIGHT = 50;

// HSN code pattern: 4-8 digits
const HSN_PATTERN = /^\d{4,8}$/;

export const CargoDetailsForm: React.FC<CargoDetailsFormProps> = ({
  cargoDetails,
  onChange,
  error,
  disabled = false,
}) => {
  const [formData, setFormData] = useState<Partial<CargoDetails>>({
    type: cargoDetails?.type || 'GENERAL',
    weight: cargoDetails?.weight || 0,
    volume: cargoDetails?.volume || undefined,
    description: cargoDetails?.description || '',
    hsnCode: cargoDetails?.hsnCode || '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (cargoDetails) {
      setFormData({
        type: cargoDetails.type,
        weight: cargoDetails.weight,
        volume: cargoDetails.volume,
        description: cargoDetails.description,
        hsnCode: cargoDetails.hsnCode,
      });
    }
  }, [cargoDetails]);

  const validateField = (name: keyof CargoDetails, value: any): string | null => {
    switch (name) {
      case 'type':
        if (!value) {
          return 'Cargo type is required';
        }
        if (!CARGO_TYPES.some(t => t.value === value)) {
          return 'Invalid cargo type';
        }
        break;

      case 'weight':
        const weight = parseFloat(value);
        if (isNaN(weight) || weight <= 0) {
          return 'Weight must be greater than 0';
        }
        if (weight < MIN_WEIGHT) {
          return `Minimum weight is ${MIN_WEIGHT} tonnes (100 kg)`;
        }
        if (weight > MAX_WEIGHT) {
          return `Maximum weight is ${MAX_WEIGHT} tonnes`;
        }
        break;

      case 'volume':
        if (value !== undefined && value !== '') {
          const volume = parseFloat(value);
          if (isNaN(volume) || volume <= 0) {
            return 'Volume must be greater than 0';
          }
          if (volume > 1000) {
            return 'Maximum volume is 1000 cubic meters';
          }
        }
        break;

      case 'description':
        if (!value || value.trim().length < 5) {
          return 'Description must be at least 5 characters';
        }
        if (value.length > 500) {
          return 'Description must not exceed 500 characters';
        }
        break;

      case 'hsnCode':
        if (value && !HSN_PATTERN.test(value)) {
          return 'HSN code must be 4-8 digits';
        }
        break;
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);

    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Update parent if all required fields are valid
    if (isCargoComplete(updatedData)) {
      const errors = validateCargo(updatedData);
      if (Object.keys(errors).length === 0) {
        onChange(updatedData as CargoDetails);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const error = validateField(name as keyof CargoDetails, value);
    if (error) {
      setValidationErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const isCargoComplete = (data: Partial<CargoDetails>): boolean => {
    return !!(
      data.type &&
      data.weight !== undefined &&
      data.weight > 0 &&
      data.description
    );
  };

  const validateCargo = (data: Partial<CargoDetails>): Record<string, string> => {
    const errors: Record<string, string> = {};
    const typeError = validateField('type', data.type);
    const weightError = validateField('weight', data.weight);
    const descError = validateField('description', data.description);
    const volumeError = validateField('volume', data.volume);
    const hsnError = validateField('hsnCode', data.hsnCode);

    if (typeError) errors.type = typeError;
    if (weightError) errors.weight = weightError;
    if (descError) errors.description = descError;
    if (volumeError) errors.volume = volumeError;
    if (hsnError) errors.hsnCode = hsnError;

    return errors;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Cargo Details</h3>

      {/* Cargo Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cargo Type <span className="text-red-500">*</span>
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={`w-full p-4 rounded-xl border-2 outline-none transition-colors bg-white ${
            touched.type && validationErrors.type
              ? 'border-red-500'
              : 'border-gray-200 focus:border-black'
          }`}
        >
          {CARGO_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {touched.type && validationErrors.type && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.type}</p>
        )}
      </div>

      {/* Weight & Volume Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (tonnes) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder="5.0"
            step="0.1"
            min={MIN_WEIGHT}
            max={MAX_WEIGHT}
            className={`w-full p-4 rounded-xl border-2 outline-none transition-colors ${
              touched.weight && validationErrors.weight
                ? 'border-red-500'
                : 'border-gray-200 focus:border-black'
            }`}
          />
          {touched.weight && validationErrors.weight && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.weight}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">Min: 0.1t, Max: 50t</p>
        </div>

        {/* Volume */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Volume (m³) <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            type="number"
            name="volume"
            value={formData.volume || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder="10.0"
            step="0.1"
            min="0.1"
            max="1000"
            className={`w-full p-4 rounded-xl border-2 outline-none transition-colors ${
              touched.volume && validationErrors.volume
                ? 'border-red-500'
                : 'border-gray-200 focus:border-black'
            }`}
          />
          {touched.volume && validationErrors.volume && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.volume}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="Describe the cargo (min 5 characters)"
          rows={3}
          maxLength={500}
          className={`w-full p-4 rounded-xl border-2 outline-none transition-colors resize-none ${
            touched.description && validationErrors.description
              ? 'border-red-500'
              : 'border-gray-200 focus:border-black'
          }`}
        />
        {touched.description && validationErrors.description && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {formData.description?.length || 0}/500 characters
        </p>
      </div>

      {/* HSN Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          HSN Code <span className="text-gray-400">(Optional)</span>
        </label>
        <input
          type="text"
          name="hsnCode"
          value={formData.hsnCode}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="12345678"
          maxLength={8}
          inputMode="numeric"
          className={`w-full p-4 rounded-xl border-2 outline-none transition-colors ${
            touched.hsnCode && validationErrors.hsnCode
              ? 'border-red-500'
              : 'border-gray-200 focus:border-black'
          }`}
        />
        {touched.hsnCode && validationErrors.hsnCode && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.hsnCode}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Harmonized System Nomenclature (4-8 digits)
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

export default CargoDetailsForm;
