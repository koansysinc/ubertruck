/**
 * Main App Component - UberTruck MVP
 *
 * This is the main entry point that integrates all Phase 1 features
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import PhoneEntry from './screens/PhoneEntry';
import RegistrationFlow from './screens/RegistrationFlow';
import OTPVerification from './screens/OTPVerification';
import ProfileSetup from './screens/ProfileSetup';
import BookingForm from './screens/BookingForm';
import BookingDetails from './screens/BookingDetails';
import Dashboard from './screens/Dashboard';
import { useAuthContext } from './context/AuthContext';
import type { BookingResponse } from './types';

// Main App Content (needs to be inside AuthProvider)
const AppContent: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthContext();
  const [currentScreen, setCurrentScreen] = useState<'phone' | 'register' | 'otp' | 'profile' | 'dashboard' | 'booking' | 'bookingDetails'>('phone');
  const [currentBooking, setCurrentBooking] = useState<BookingResponse | null>(null);
  const [otpData, setOtpData] = useState<{
    sessionId: string;
    phoneNumber: string;
    otpExpiresIn: number;
    otp?: string; // OTP visible in development mode
  } | null>(null);

  // Handle phone entry success
  const handlePhoneSuccess = (sessionId: string, phoneNumber: string, otpExpiresIn: number, devOtp?: string) => {
    setOtpData({ sessionId, phoneNumber, otpExpiresIn, otp: devOtp });
    setCurrentScreen('otp');
  };

  // Handle registration success
  const handleRegistrationSuccess = (sessionId: string, phoneNumber: string, otp?: string) => {
    setOtpData({ sessionId, phoneNumber, otpExpiresIn: 300, otp });
    setCurrentScreen('otp');
  };

  // Handle OTP verification success
  const handleOTPSuccess = () => {
    // Skip profile setup for now, go directly to dashboard
    setCurrentScreen('dashboard');
  };

  // Handle profile setup complete (or skipped)
  const handleProfileComplete = () => {
    setCurrentScreen('dashboard');
  };

  // Handle booking success
  const handleBookingSuccess = (booking: BookingResponse) => {
    console.log('Booking created:', booking);

    // Store the booking in localStorage for dashboard retrieval
    localStorage.setItem('lastCreatedBooking', JSON.stringify(booking));

    setCurrentBooking(booking);
    setCurrentScreen('bookingDetails');
  };

  // If not authenticated, show authentication flow
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {currentScreen === 'phone' && (
          <PhoneEntry
            onSuccess={handlePhoneSuccess}
            onRegister={() => setCurrentScreen('register')}
          />
        )}

        {currentScreen === 'register' && (
          <RegistrationFlow
            onSuccess={handleRegistrationSuccess}
            onBackToLogin={() => setCurrentScreen('phone')}
          />
        )}

        {currentScreen === 'otp' && otpData && (
          <OTPVerification
            sessionId={otpData.sessionId}
            phoneNumber={otpData.phoneNumber}
            otpExpiresIn={otpData.otpExpiresIn}
            devOtp={otpData.otp}
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
        <Dashboard
          onCreateBooking={() => setCurrentScreen('booking')}
          onViewBooking={(booking) => {
            setCurrentBooking(booking);
            setCurrentScreen('bookingDetails');
          }}
        />
      )}

      {currentScreen === 'booking' && (
        <BookingForm
          onSuccess={handleBookingSuccess}
          onCancel={() => setCurrentScreen('dashboard')}
        />
      )}

      {currentScreen === 'bookingDetails' && currentBooking && (
        <BookingDetails
          booking={currentBooking}
          onClose={() => setCurrentScreen('dashboard')}
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
