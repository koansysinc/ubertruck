/**
 * PriceBreakdown Component
 *
 * Displays detailed price breakdown for a booking
 * - Base price (₹5/tonne/km)
 * - Surcharges (fuel, toll, handling)
 * - GST breakdown (CGST 9% + SGST 9% OR IGST 18%)
 * - Total price
 * - Validity timer
 */

import React, { useEffect, useState } from 'react';
import type { PriceCalculation } from '../types';

interface PriceBreakdownProps {
  priceCalculation: PriceCalculation | null;
  isExpired: boolean;
  timeRemaining: number;
  onRecalculate?: () => void;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  priceCalculation,
  isExpired,
  timeRemaining,
  onRecalculate,
}) => {
  const [animatedTotal, setAnimatedTotal] = useState(0);

  // Animate total price
  useEffect(() => {
    if (!priceCalculation) {
      setAnimatedTotal(0);
      return;
    }

    const targetTotal = priceCalculation.totalPrice || priceCalculation.totalAmount || 0;
    const duration = 500; // ms
    const steps = 30;
    const increment = targetTotal / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;

      if (step >= steps) {
        setAnimatedTotal(targetTotal);
        clearInterval(timer);
      } else {
        setAnimatedTotal(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [priceCalculation]);

  if (!priceCalculation) {
    return null;
  }

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const isInterstate = priceCalculation.gstBreakdown?.igst && priceCalculation.gstBreakdown.igst > 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header with Validity Timer */}
      <div className={`p-4 ${isExpired ? 'bg-red-50' : 'bg-yellow-50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600">Price Quote</p>
            <p className={`text-sm font-bold ${isExpired ? 'text-red-600' : 'text-yellow-700'}`}>
              {isExpired ? (
                'Expired - Please recalculate'
              ) : (
                <>Valid for {formatTime(timeRemaining)}</>
              )}
            </p>
          </div>
          {isExpired && onRecalculate && (
            <button
              onClick={onRecalculate}
              className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 active:scale-95 transition-all"
            >
              Recalculate
            </button>
          )}
        </div>
      </div>

      {/* Price Details */}
      <div className="p-6 space-y-4">
        {/* Base Price */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-700">Base Price</p>
            <p className="text-xs text-gray-400">
              {(priceCalculation.distance || 0).toFixed(1)} km × {priceCalculation.cargoDetails?.weight || 0} tonnes @ ₹5/tonne/km
            </p>
          </div>
          <p className="text-base font-bold text-gray-900">{formatCurrency(priceCalculation.basePrice)}</p>
        </div>

        {/* Surcharges */}
        {priceCalculation.surcharges && priceCalculation.surcharges.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Surcharges</p>
            {priceCalculation.surcharges.map((surcharge, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-700">{surcharge.type}</p>
                  {surcharge.description && (
                    <p className="text-xs text-gray-400">{surcharge.description}</p>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-700">{formatCurrency(surcharge.amount)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Subtotal (before GST) */}
        <div className="flex justify-between items-center border-t pt-3">
          <p className="text-sm font-semibold text-gray-700">Subtotal (before tax)</p>
          <p className="text-base font-bold text-gray-900">
            {formatCurrency(priceCalculation.basePrice + (priceCalculation.surcharges?.reduce((sum, s) => sum + s.amount, 0) || 0))}
          </p>
        </div>

        {/* GST Breakdown */}
        <div className="space-y-2 border-t pt-3 bg-gray-50 -mx-6 px-6 py-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">GST (18%)</p>
          {isInterstate ? (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">IGST (18%)</p>
                <p className="text-xs text-gray-400">Interstate GST</p>
              </div>
              <p className="text-sm font-semibold text-gray-700">
                {formatCurrency(priceCalculation.gstBreakdown?.igst || 0)}
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-700">CGST (9%)</p>
                  <p className="text-xs text-gray-400">Central GST</p>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  {formatCurrency(priceCalculation.gstBreakdown?.cgst || 0)}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-700">SGST (9%)</p>
                  <p className="text-xs text-gray-400">State GST</p>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  {formatCurrency(priceCalculation.gstBreakdown?.sgst || 0)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center border-t-2 border-gray-300 pt-4">
          <p className="text-lg font-bold text-gray-900">Total Amount</p>
          <p className="text-2xl font-bold text-black">
            {formatCurrency(animatedTotal)}
          </p>
        </div>

        {/* Payment Terms */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-blue-900">Payment Terms</p>
              <p className="text-xs text-blue-700 mt-1">
                Full payment required before pickup. GST invoice will be provided.
              </p>
            </div>
          </div>
        </div>

        {/* Distance & Weight Info */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Distance</p>
            <p className="text-lg font-bold text-gray-900">{(priceCalculation.distance || 0).toFixed(1)} km</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Weight</p>
            <p className="text-lg font-bold text-gray-900">
              {priceCalculation.cargoDetails?.weight || 0} tonnes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceBreakdown;
