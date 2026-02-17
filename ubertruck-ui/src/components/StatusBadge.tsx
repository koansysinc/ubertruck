import React from 'react';

const STATUS_COLORS = {
  CREATED: 'bg-blue-100 text-blue-800',
  DRIVER_ASSIGNED: 'bg-green-100 text-green-800',
  EN_ROUTE_TO_PICKUP: 'bg-purple-100 text-purple-800',
  ARRIVED_AT_PICKUP: 'bg-orange-100 text-orange-800',
  CARGO_LOADED: 'bg-indigo-100 text-indigo-800',
  IN_TRANSIT: 'bg-teal-100 text-teal-800',
  ARRIVED_AT_DELIVERY: 'bg-orange-100 text-orange-800',
  CARGO_UNLOADED: 'bg-lime-100 text-lime-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

const STATUS_LABELS = {
  CREATED: 'Created',
  DRIVER_ASSIGNED: 'Driver Assigned',
  EN_ROUTE_TO_PICKUP: 'En Route to Pickup',
  ARRIVED_AT_PICKUP: 'Arrived at Pickup',
  CARGO_LOADED: 'Cargo Loaded',
  IN_TRANSIT: 'In Transit',
  ARRIVED_AT_DELIVERY: 'Arrived at Delivery',
  CARGO_UNLOADED: 'Cargo Unloaded',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalizedStatus = status?.toUpperCase().replace(/\s+/g, '_') || 'CREATED';
  const colorClass = STATUS_COLORS[normalizedStatus as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
  const label = STATUS_LABELS[normalizedStatus as keyof typeof STATUS_LABELS] || status;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
      {label}
    </span>
  );
};