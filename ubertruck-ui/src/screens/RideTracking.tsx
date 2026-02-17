import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Package, MapPin, Phone, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { StatusTimeline } from '../components/StatusTimeline';
import { useBookingStatus } from '../hooks/useBookingStatus';
import { useETA } from '../hooks/useETA';

export const RideTracking: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { booking, isConnected, isPolling, updateMethod } = useBookingStatus(bookingId || null);

  // Calculate ETA based on status and distance
  const distance = booking ?
    (booking.status === 'IN_TRANSIT' ? booking.route?.totalDistance :
     booking.status === 'EN_ROUTE_TO_PICKUP' ? booking.route?.pickupDistance : 0) || 0
    : 0;

  const { etaFormatted } = useETA(booking?.status || '', distance);

  useEffect(() => {
    // Log the update method for debugging
    console.log(`[RideTracking] Update method: ${updateMethod}`);
  }, [updateMethod]);

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Booking ID Provided</h2>
          <button
            onClick={() => navigate('/bookings')}
            className="text-blue-600 hover:underline"
          >
            View All Bookings
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Track Shipment</h1>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <span className="text-gray-500">Update via: </span>
                <span className={`font-medium ${isPolling ? 'text-orange-600' : 'text-green-600'}`}>
                  {isPolling ? 'Polling' : 'Real-time'}
                </span>
              </div>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Booking #{booking.id.slice(0, 8)}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Created on {new Date(booking.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Pickup Location */}
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pickup Location</p>
                    <p className="text-sm text-gray-600">{booking.pickupLocation?.address || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Pincode: {booking.pickupLocation?.pincode || 'N/A'}</p>
                  </div>
                </div>

                {/* Delivery Location */}
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delivery Location</p>
                    <p className="text-sm text-gray-600">{booking.deliveryLocation?.address || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Pincode: {booking.deliveryLocation?.pincode || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Cargo Details */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center mb-3">
                  <Package className="w-5 h-5 text-gray-400 mr-3" />
                  <h3 className="font-medium text-gray-900">Cargo Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium">{booking.cargoDetails?.type || 'General'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Weight</p>
                    <p className="font-medium">{booking.cargoDetails?.weight || 0} tonnes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <StatusTimeline
              currentStatus={booking.status}
              eta={etaFormatted}
            />
          </div>

          {/* Right Column - Driver & Vehicle Info */}
          <div className="space-y-6">
            {/* Driver Information */}
            {booking.driver && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <Truck className="w-5 h-5 text-gray-400 mr-3" />
                  <h3 className="font-medium text-gray-900">Driver Information</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{booking.driver.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {booking.driver.phoneNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vehicle</p>
                    <p className="font-medium">{booking.vehicle?.registrationNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Truck Type</p>
                    <p className="font-medium">{booking.vehicle?.type || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Price Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-medium text-gray-900 mb-4">Price Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Price</span>
                  <span className="font-medium">₹{booking.pricing?.basePrice?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium">
                    ₹{((booking.pricing?.gst?.cgst || 0) + (booking.pricing?.gst?.sgst || 0)).toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Amount</span>
                    <span className="text-lg font-semibold text-blue-600">
                      ₹{booking.pricing?.totalAmount?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-medium text-gray-900 mb-4">Payment Status</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  booking.paymentStatus === 'PAID'
                    ? 'bg-green-100 text-green-800'
                    : booking.paymentStatus === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {booking.paymentStatus || 'PENDING'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};