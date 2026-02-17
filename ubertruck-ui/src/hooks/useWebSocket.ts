import { useEffect, useState } from 'react';
import { websocketClient } from '../services/websocket';

export function useWebSocket(bookingId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    if (!bookingId) return;

    // Connect to WebSocket
    websocketClient.connect()
      .then(() => {
        setIsConnected(true);
        websocketClient.subscribe(bookingId);
      })
      .catch((error) => {
        console.error('[useWebSocket] Connection failed:', error);
        setIsConnected(false);
      });

    // Listen for status updates
    const handleStatusUpdate = (data: any) => {
      console.log('[useWebSocket] Status update received:', data);
      setLastMessage(data);
    };

    websocketClient.on('status_update', handleStatusUpdate);

    // Cleanup
    return () => {
      websocketClient.off('status_update', handleStatusUpdate);
      if (bookingId) {
        websocketClient.unsubscribe(bookingId);
      }
    };
  }, [bookingId]);

  return { isConnected, lastMessage };
}