/**
 * Main App Component - UberTruck MVP
 *
 * This is the main entry point that integrates all Phase 1 features
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import PhoneEntry from './screens/PhoneEntry';
import OTPVerification from './screens/OTPVerification';
import ProfileSetup from './screens/ProfileSetup';
import BookingForm from './screens/BookingForm';
import { useAuthContext } from './context/AuthContext';
import type { BookingResponse } from './types';

// Main App Content (needs to be inside AuthProvider)
const AppContent: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthContext();
  const [currentScreen, setCurrentScreen] = useState<'phone' | 'otp' | 'profile' | 'dashboard' | 'booking'>('phone');
  const [otpData, setOtpData] = useState<{
    sessionId: string;
    phoneNumber: string;
    otpExpiresIn: number;
  } | null>(null);

  // Handle phone entry success
  const handlePhoneSuccess = (sessionId: string, phoneNumber: string, otpExpiresIn: number) => {
    setOtpData({ sessionId, phoneNumber, otpExpiresIn });
    setCurrentScreen('otp');
  };

  // Handle OTP verification success
  const handleOTPSuccess = () => {
    setCurrentScreen('profile');
  };

  // Handle profile setup complete (or skipped)
  const handleProfileComplete = () => {
    setCurrentScreen('dashboard');
  };

  // Handle booking success
  const handleBookingSuccess = (booking: BookingResponse) => {
    console.log('Booking created:', booking);
    alert(`Booking created successfully!\nBooking ID: ${booking.bookingId}\nStatus: ${booking.status}`);
    setCurrentScreen('dashboard');
  };

  // If not authenticated, show authentication flow
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {currentScreen === 'phone' && (
          <PhoneEntry onSuccess={handlePhoneSuccess} />
        )}

        {currentScreen === 'otp' && otpData && (
          <OTPVerification
            sessionId={otpData.sessionId}
            phoneNumber={otpData.phoneNumber}
            otpExpiresIn={otpData.otpExpiresIn}
            onSuccess={handleOTPSuccess}
            onBack={() => setCurrentScreen('phone')}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileSetup
            onComplete={handleProfileComplete}
            onSkip={handleProfileComplete}
          />
        )}
      </div>
    );
  }

  // If authenticated, show dashboard or booking
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">UberTruck</h1>
              <p className="text-sm text-gray-500">Logistics Made Simple</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.businessName || user?.phoneNumber}
                </p>
                <p className="text-xs text-gray-500">{user?.userType}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {currentScreen === 'dashboard' && (
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to UberTruck! 🚚
            </h2>
            <p className="text-gray-600 mb-6">
              Book your logistics transport in 4 easy steps. Fast, reliable, and transparent pricing.
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-xl p-6">
                <div className="text-blue-600 text-3xl font-bold mb-2">₹5</div>
                <p className="text-sm text-blue-900">per tonne per km</p>
                <p className="text-xs text-blue-600 mt-1">Base rate</p>
              </div>
              <div className="bg-green-50 rounded-xl p-6">
                <div className="text-green-600 text-3xl font-bold mb-2">0.1-50</div>
                <p className="text-sm text-green-900">tonnes capacity</p>
                <p className="text-xs text-green-600 mt-1">Flexible loads</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-6">
                <div className="text-purple-600 text-3xl font-bold mb-2">15 min</div>
                <p className="text-sm text-purple-900">price validity</p>
                <p className="text-xs text-purple-600 mt-1">Lock your rate</p>
              </div>
            </div>

            {/* Create Booking Button */}
            <button
              onClick={() => setCurrentScreen('booking')}
              className="w-full md:w-auto px-8 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 active:scale-95 transition-all"
            >
              Create New Booking
            </button>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">✨ Key Features</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <div>
                    <p className="font-medium text-gray-900">Dynamic Pricing</p>
                    <p className="text-sm text-gray-600">Real-time calculation with GST breakdown</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <div>
                    <p className="font-medium text-gray-900">4-Step Booking</p>
                    <p className="text-sm text-gray-600">Locations → Cargo → Contacts → Confirm</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <div>
                    <p className="font-medium text-gray-900">Secure Authentication</p>
                    <p className="text-sm text-gray-600">OTP-based phone verification</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📋 How It Works</h3>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <p className="text-sm text-gray-600">Enter pickup and delivery locations</p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <p className="text-sm text-gray-600">Provide cargo details (type, weight, description)</p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <p className="text-sm text-gray-600">Add contact information for pickup and delivery</p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <p className="text-sm text-gray-600">Review price breakdown and confirm booking</p>
                </li>
              </ol>
            </div>
          </div>
        </main>
      )}

      {currentScreen === 'booking' && (
        <BookingForm
          onSuccess={handleBookingSuccess}
          onCancel={() => setCurrentScreen('dashboard')}
        />
      )}
    </div>
  );
};

// Main App with AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
