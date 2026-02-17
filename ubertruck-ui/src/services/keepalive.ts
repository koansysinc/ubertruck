/**
 * Database Keepalive Service
 * Prevents Neon database from auto-suspending by sending periodic pings
 */

import { apiClient } from './api';

class KeepaliveService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL = 4 * 60 * 1000; // 4 minutes (before 5-min suspend)
  private isEnabled = false;

  /**
   * Start automatic keepalive pings
   */
  start() {
    if (this.intervalId) {
      console.warn('[Keepalive] Already running');
      return;
    }

    this.isEnabled = true;

    // Send immediate ping
    this.ping();

    // Schedule periodic pings
    this.intervalId = setInterval(() => {
      this.ping();
    }, this.PING_INTERVAL);

    console.log('[Keepalive] Started - pinging every 4 minutes');
  }

  /**
   * Stop automatic keepalive pings
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isEnabled = false;
      console.log('[Keepalive] Stopped');
    }
  }

  /**
   * Send a single keepalive ping
   */
  async ping(): Promise<{ status: string; responseTime?: string; error?: string }> {
    try {
      const start = Date.now();
      const response = await apiClient.get('/keepalive');
      const duration = Date.now() - start;

      console.log(`[Keepalive] Ping successful - ${duration}ms`, response.data);

      return {
        status: 'success',
        responseTime: `${duration}ms`,
        ...response.data
      };
    } catch (error: any) {
      console.warn('[Keepalive] Ping failed', error.message);

      // If database is suspended, try to wake it
      if (error.response?.status === 503) {
        console.log('[Keepalive] Database may be suspended - attempting wake...');
        await this.wake();
      }

      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Force database wake-up with retry logic
   */
  async wake(): Promise<{ status: string; attempt?: number; error?: string }> {
    try {
      console.log('[Keepalive] Sending wake request...');
      const response = await apiClient.post('/keepalive/wake');

      console.log('[Keepalive] Database awakened', response.data);

      return {
        status: 'awake',
        ...response.data
      };
    } catch (error: any) {
      console.error('[Keepalive] Wake failed', error.message);

      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Get current database status
   */
  async getStatus(): Promise<any> {
    try {
      const response = await apiClient.get('/keepalive/status');
      return response.data;
    } catch (error: any) {
      return {
        status: 'disconnected',
        error: error.message
      };
    }
  }

  /**
   * Check if keepalive is currently running
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }

  /**
   * Check if keepalive is enabled
   */
  enabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const keepaliveService = new KeepaliveService();

// Auto-start keepalive when app loads (only in production or when using real DB)
if (process.env.REACT_APP_ENABLE_KEEPALIVE !== 'false') {
  // Start after a short delay to ensure app is initialized
  setTimeout(() => {
    keepaliveService.start();
  }, 5000); // 5 seconds after app load
}
