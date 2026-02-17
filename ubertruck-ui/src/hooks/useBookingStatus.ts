import { useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import { api } from '../services/api';
import type { BookingResponse } from '../types';

export function useBookingStatus(bookingId: string | null) {
  const { isConnected, lastMessage } = useWebSocket(bookingId);
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Update booking when WebSocket message received
  useEffect(() => {
    if (lastMessage && lastMessage.bookingId === bookingId) {
      setBooking((prev) => prev ? {
        ...prev,
        status: lastMessage.status,
        eta: lastMessage.eta
      } : null);
    }
  }, [lastMessage, bookingId]);

  // Polling fallback when WebSocket disconnected
  useEffect(() => {
    if (!bookingId) return;

    let intervalId: NodeJS.Timeout;

    // Start polling if WebSocket not connected
    if (!isConnected) {
      console.log('[useBookingStatus] WebSocket disconnected, starting polling');
      setIsPolling(true);

      const pollBooking = async () => {
        try {
          const updated = await api.getBooking(bookingId);
          setBooking(updated);
        } catch (error) {
          console.error('[useBookingStatus] Polling error:', error);
        }
      };

      // Initial fetch
      pollBooking();

      // Poll every 10 seconds
      intervalId = setInterval(pollBooking, 10000);
    } else {
      setIsPolling(false);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [bookingId, isConnected]);

  return {
    booking,
    isConnected,
    isPolling,
    updateMethod: isConnected ? 'websocket' : 'polling'
  };
}