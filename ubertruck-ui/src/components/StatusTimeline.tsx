import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';

const TIMELINE_STATUSES = [
  { key: 'CREATED', label: 'Booking Created', description: 'Your booking has been placed' },
  { key: 'DRIVER_ASSIGNED', label: 'Driver Assigned', description: 'A driver has been assigned to your shipment' },
  { key: 'EN_ROUTE_TO_PICKUP', label: 'En Route to Pickup', description: 'Driver is on the way to pickup location' },
  { key: 'ARRIVED_AT_PICKUP', label: 'Arrived at Pickup', description: 'Driver has arrived at the pickup location' },
  { key: 'CARGO_LOADED', label: 'Cargo Loaded', description: 'Your cargo has been loaded onto the truck' },
  { key: 'IN_TRANSIT', label: 'In Transit', description: 'Your cargo is on the way to the destination' },
  { key: 'ARRIVED_AT_DELIVERY', label: 'Arrived at Delivery', description: 'Truck has arrived at the delivery location' },
  { key: 'CARGO_UNLOADED', label: 'Cargo Unloaded', description: 'Your cargo has been unloaded' },
  { key: 'COMPLETED', label: 'Completed', description: 'Delivery completed successfully' }
];

interface StatusTimelineProps {
  currentStatus: string;
  eta?: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStatus, eta }) => {
  const normalizedStatus = currentStatus?.toUpperCase().replace(/\s+/g, '_') || 'CREATED';

  const getStatusIndex = (status: string) => {
    return TIMELINE_STATUSES.findIndex(s => s.key === status);
  };

  const currentIndex = getStatusIndex(normalizedStatus);

  const getStatusIcon = (index: number) => {
    if (index < currentIndex) {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    } else if (index === currentIndex) {
      return <Clock className="w-6 h-6 text-blue-500 animate-pulse" />;
    } else {
      return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  const getStatusColor = (index: number) => {
    if (index < currentIndex) {
      return 'bg-green-500';
    } else if (index === currentIndex) {
      return 'bg-blue-500';
    } else {
      return 'bg-gray-300';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Shipment Status</h3>
        {eta && (
          <p className="text-sm text-gray-600 mt-1">
            Estimated time: <span className="font-medium">{eta}</span>
          </p>
        )}
      </div>

      <div className="relative">
        {TIMELINE_STATUSES.map((status, index) => (
          <div key={status.key} className="flex items-start mb-8 last:mb-0">
            {/* Icon and Line */}
            <div className="relative flex flex-col items-center mr-4">
              <div className="z-10 bg-white">
                {getStatusIcon(index)}
              </div>
              {index < TIMELINE_STATUSES.length - 1 && (
                <div
                  className={`absolute top-8 w-0.5 h-16 ${getStatusColor(index)}`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 ${index <= currentIndex ? 'opacity-100' : 'opacity-50'}`}>
              <h4 className="font-medium text-gray-900">
                {status.label}
                {index === currentIndex && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Current
                  </span>
                )}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{status.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};