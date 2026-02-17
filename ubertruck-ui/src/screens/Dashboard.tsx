/**
 * Dashboard Component
 *
 * Main dashboard following Uber/Rapido patterns with:
 * - Shipper view: All scheduled bookings with live tracking
 * - Driver view: Confirmed & accepted bookings
 * - Consistent UI/UX patterns
 */

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import api from '../services/api';
import type { BookingResponse } from '../types';

interface DashboardProps {
  onCreateBooking: () => void;
  onViewBooking: (booking: BookingResponse) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onCreateBooking, onViewBooking }) => {
  const { user } = useAuthContext();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'scheduled' | 'completed'>('active');

  useEffect(() => {
    fetchBookings();
    // Refresh bookings every 30 seconds for live updates
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.getMyBookings();
      console.log('[Dashboard] API response:', response);

      // Check if we have bookings from API
      const apiBookings = response.bookings || [];

      // Also check localStorage for any created bookings
      const storedBooking = localStorage.getItem('lastCreatedBooking');
      let allBookings = [...apiBookings];

      if (storedBooking) {
        try {
          const booking = JSON.parse(storedBooking);
          // Ensure the booking has all required fields
          if (booking.bookingId && !booking.bookingNumber) {
            booking.bookingNumber = booking.bookingId; // Use bookingId as bookingNumber if missing
          }
          // Add stored booking if not already in list
          const exists = allBookings.some(b =>
            (b.bookingId && b.bookingId === booking.bookingId) ||
            (b.bookingNumber && b.bookingNumber === booking.bookingNumber)
          );
          if (!exists) {
            console.log('[Dashboard] Adding stored booking:', booking);
            allBookings = [booking, ...allBookings];
          }
        } catch (e) {
          console.error('Failed to parse stored booking:', e);
        }
      }

      // Don't use mock data if we have real bookings
      if (allBookings.length === 0 && user?.userType !== 'SHIPPER') {
        console.log('[Dashboard] No bookings found, using mock data for demo');
        allBookings = getMockBookings();
      }

      console.log('[Dashboard] Setting bookings:', allBookings.length, 'bookings');
      setBookings(allBookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);

      // Check localStorage first
      const storedBooking = localStorage.getItem('lastCreatedBooking');
      let fallbackBookings = [];

      if (storedBooking) {
        try {
          const booking = JSON.parse(storedBooking);
          // Ensure the booking has all required fields
          if (booking.bookingId && !booking.bookingNumber) {
            booking.bookingNumber = booking.bookingId;
          }
          fallbackBookings = [booking];
          console.log('[Dashboard] Using stored booking as fallback:', booking);
        } catch (e) {
          console.error('Failed to parse stored booking:', e);
        }
      }

      // Only add mock data for non-shippers if no bookings
      if (fallbackBookings.length === 0 && user?.userType !== 'SHIPPER') {
        fallbackBookings = getMockBookings();
      }

      console.log('[Dashboard] Setting fallback bookings:', fallbackBookings.length, 'bookings');
      setBookings(fallbackBookings);
    } finally {
      setLoading(false);
    }
  };

  const getMockBookings = (): BookingResponse[] => {
    const isDriver = user?.userType === 'CARRIER' || user?.userType === 'DRIVER';

    if (isDriver) {
      // Driver view: Show accepted bookings
      return [
        {
          bookingId: 'booking-mock-001',
          bookingNumber: 'UBT-2024-001',
          status: 'ASSIGNED',
          pickupLocation: {
            address: 'Nalgonda Warehouse',
            pincode: '508001',
            lat: 17.0477,
            lng: 79.2666
          },
          deliveryLocation: {
            address: 'Miryalguda Hub',
            pincode: '508207',
            lat: 16.8700,
            lng: 79.5900
          },
          scheduledPickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          totalAmount: 12500,
          distance: 50,
          cargoDetails: { type: 'Electronics', weight: 5 },
          driver: {
            name: 'You',
            phone: user?.phoneNumber || null,
          },
          vehicle: {
            registration: 'TS 07 AB 1234',
            type: '10T Truck',
          },
        },
        {
          bookingId: 'booking-mock-002',
          bookingNumber: 'UBT-2024-002',
          status: 'PICKUP_STARTED',
          pickupLocation: {
            address: 'Hyderabad Central',
            pincode: '500001',
            lat: 17.3850,
            lng: 78.4867
          },
          deliveryLocation: {
            address: 'Warangal Depot',
            pincode: '506001',
            lat: 17.9784,
            lng: 79.5941
          },
          scheduledPickupTime: new Date().toISOString(),
          totalAmount: 18750,
          distance: 75,
          cargoDetails: { type: 'Textiles', weight: 10 },
          driver: {
            name: 'You',
            phone: user?.phoneNumber || null,
          },
          vehicle: {
            registration: 'TS 07 AB 1234',
            type: '10T Truck',
          },
        },
      ];
    }

    // Shipper view: Show all bookings
    return [
      {
        bookingId: 'booking-mock-003',
        bookingNumber: 'UBT-2024-003',
        status: 'IN_TRANSIT',
        pickupLocation: {
          address: 'Nalgonda Warehouse',
          pincode: '508001',
          lat: 17.0477,
          lng: 79.2666
        },
        deliveryLocation: {
          address: 'Miryalguda Hub',
          pincode: '508207',
          lat: 16.8700,
          lng: 79.5900
        },
        scheduledPickupTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        totalAmount: 7500,
        distance: 30,
        cargoDetails: { type: 'Agricultural Products', weight: 15 },
        driver: {
          name: 'Rajesh Kumar',
          phone: '+919876543210',
        },
        vehicle: {
          registration: 'TS 09 CD 5678',
          type: '15T Truck',
        },
      },
      {
        bookingNumber: 'UBT-2024-004',
        status: 'ASSIGNED',
        pickupLocation: { address: 'Suryapet Storage', pincode: '508213' },
        deliveryLocation: { address: 'Kodad Market', pincode: '508206' },
        scheduledPickupTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        totalAmount: 5000,
        distance: 20,
        cargoDetails: { type: 'FMCG', weight: 8 },
        driver: {
          name: 'Mohammed Ali',
          phone: '+919876543211',
        },
        vehicle: {
          registration: 'TS 10 EF 9012',
          type: '10T Truck',
        },
      },
      {
        bookingNumber: 'UBT-2024-005',
        status: 'CREATED',
        pickupLocation: { address: 'Bhongir Factory', pincode: '508116' },
        deliveryLocation: { address: 'Jangaon Warehouse', pincode: '506167' },
        scheduledPickupTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        totalAmount: 10000,
        distance: 40,
        cargoDetails: { type: 'Industrial Equipment', weight: 20 },
      },
    ];
  };

  const getStatusColor = (status: string) => {
    // Handle both uppercase and lowercase statuses
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'PICKUP_STARTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED':
        return 'bg-green-100 text-green-800';
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CREATED':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    // Handle both uppercase and lowercase statuses
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
      case 'IN_TRANSIT':
        return '🚚 In Transit';
      case 'PICKUP_STARTED':
        return '📦 Pickup Started';
      case 'ASSIGNED':
        return '✅ Driver Assigned';
      case 'CREATED':
        return '📝 Booking Created';
      case 'DELIVERED':
        return '✔️ Delivered';
      default:
        return status;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 0) {
      return `Started ${Math.abs(diffHours)} hours ago`;
    } else if (diffHours < 24) {
      return `In ${diffHours} hours`;
    }

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isDriver = user?.userType === 'CARRIER' || user?.userType === 'DRIVER';

  // Handle both uppercase and lowercase status values from backend
  const activeBookings = bookings.filter(b => {
    const status = b.status?.toUpperCase();
    return ['IN_TRANSIT', 'PICKUP_STARTED', 'ASSIGNED'].includes(status);
  });

  const scheduledBookings = bookings.filter(b => {
    const status = b.status?.toUpperCase();
    return ['CREATED', 'CONFIRMED'].includes(status);
  });

  const completedBookings = bookings.filter(b => {
    const status = b.status?.toUpperCase();
    return ['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(status);
  });

  const renderBookingCard = (booking: BookingResponse) => {
    // Handle both uppercase and lowercase statuses
    const upperStatus = booking.status?.toUpperCase();
    const isLiveTracking = ['IN_TRANSIT', 'PICKUP_STARTED'].includes(upperStatus);
    // Use bookingId or bookingNumber as key
    const bookingKey = booking.bookingId || booking.bookingNumber || Math.random().toString();

    return (
      <div
        key={bookingKey}
        onClick={() => onViewBooking(booking)}
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {booking.bookingNumber || booking.bookingId || 'New Booking'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {formatTime(booking.scheduledPickupTime || booking.pickupDate || new Date().toISOString())}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
              {getStatusLabel(booking.status)}
            </span>
            {isLiveTracking && (
              <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                LIVE
              </span>
            )}
          </div>
        </div>

        {/* Route */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {typeof booking.pickupLocation === 'string'
                  ? booking.pickupLocation
                  : booking.pickupLocation?.address || 'Pickup Location'}
              </p>
              {typeof booking.pickupLocation === 'object' && booking.pickupLocation?.pincode && (
                <p className="text-xs text-gray-500">Pickup • {booking.pickupLocation.pincode}</p>
              )}
            </div>
          </div>

          <div className="ml-2.5 border-l-2 border-dashed border-gray-300 h-8"></div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {typeof booking.deliveryLocation === 'string'
                  ? booking.deliveryLocation
                  : booking.deliveryLocation?.address || 'Delivery Location'}
              </p>
              {typeof booking.deliveryLocation === 'object' && booking.deliveryLocation?.pincode && (
                <p className="text-xs text-gray-500">Delivery • {booking.deliveryLocation.pincode}</p>
              )}
            </div>
          </div>
        </div>

        {/* Driver Info (for shippers) or Cargo Info (for drivers) */}
        {booking.driver && !isDriver ? (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{booking.driver.name}</p>
                  <p className="text-xs text-gray-500">
                    {booking.vehicle?.type} • {booking.vehicle?.registration}
                  </p>
                </div>
              </div>
              {booking.driver.phone && (
                <a
                  href={`tel:${booking.driver.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {booking.cargoDetails?.type || booking.cargoType || 'General'} • {booking.cargoDetails?.weight || booking.cargoWeight || 0} tonnes
              </span>
              <span className="font-semibold text-gray-900">
                ₹{(booking.totalAmount || booking.totalPrice || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {booking.distance || 'N/A'} km
          </span>
          {isLiveTracking && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewBooking(booking);
              }}
              className="text-blue-600 font-medium hover:text-blue-700"
            >
              Track Live →
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome to UberTruck! 🚚
              </h1>
              <p className="text-gray-600 mt-1">
                Book your logistics transport in 4 easy steps. Fast, reliable, and transparent pricing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Primary Action */}
        {!isDriver && (
          <button
            onClick={onCreateBooking}
            className="w-full mb-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Booking
          </button>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active ({activeBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'scheduled'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Scheduled ({scheduledBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'completed'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Completed ({completedBookings.length})
          </button>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'active' && activeBookings.map(renderBookingCard)}
            {activeTab === 'scheduled' && scheduledBookings.map(renderBookingCard)}
            {activeTab === 'completed' && completedBookings.map(renderBookingCard)}

            {activeTab === 'active' && activeBookings.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500">No active bookings</p>
                {!isDriver && (
                  <button
                    onClick={onCreateBooking}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Booking
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;