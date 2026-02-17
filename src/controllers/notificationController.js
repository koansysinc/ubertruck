/**
 * Notification Controller
 * Handles notification-related API endpoints
 * PHASE 4: Notification System
 */

const notificationService = require('../services/notificationService');
const { authenticateToken } = require('../utils/auth');

class NotificationController {
  /**
   * Get user notifications
   * GET /api/v1/notifications
   */
  async getUserNotifications(req, res) {
    try {
      const userId = req.user?.userId || req.query.userId || 'test-user';
      const limit = parseInt(req.query.limit) || 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      const notifications = notificationService.getUserNotifications(
        userId,
        limit,
        unreadOnly
      );

      res.json({
        success: true,
        count: notifications.length,
        unreadOnly,
        notifications
      });
    } catch (error) {
      console.error('[NotificationController] Get notifications error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch notifications',
          code: 'NOTIFICATION_FETCH_FAILED'
        }
      });
    }
  }

  /**
   * Send notification (for testing)
   * POST /api/v1/notifications/send
   */
  async sendNotification(req, res) {
    try {
      const { userId, type, data, channels } = req.body;

      if (!userId || !type) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'userId and type are required',
            code: 'INVALID_REQUEST'
          }
        });
      }

      const notification = await notificationService.sendNotification(
        userId,
        type,
        data || {},
        channels
      );

      res.json({
        success: true,
        notification
      });
    } catch (error) {
      console.error('[NotificationController] Send notification error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to send notification',
          code: 'NOTIFICATION_SEND_FAILED'
        }
      });
    }
  }

  /**
   * Mark notification as read
   * PUT /api/v1/notifications/:notificationId/read
   */
  async markAsRead(req, res) {
    try {
      const userId = req.user?.userId || req.body.userId || 'test-user';
      const { notificationId } = req.params;

      const success = notificationService.markAsRead(userId, notificationId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Notification not found',
            code: 'NOTIFICATION_NOT_FOUND'
          }
        });
      }

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('[NotificationController] Mark as read error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to mark notification as read',
          code: 'MARK_READ_FAILED'
        }
      });
    }
  }

  /**
   * Mark all notifications as read
   * PUT /api/v1/notifications/read-all
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user?.userId || req.body.userId || 'test-user';

      const count = notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: `${count} notifications marked as read`,
        count
      });
    } catch (error) {
      console.error('[NotificationController] Mark all as read error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to mark all notifications as read',
          code: 'MARK_ALL_READ_FAILED'
        }
      });
    }
  }

  /**
   * Schedule ride reminder
   * POST /api/v1/notifications/schedule-reminder
   */
  async scheduleReminder(req, res) {
    try {
      const { bookingId, userId, pickupTime, reminderMinutes } = req.body;

      if (!bookingId || !userId || !pickupTime) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'bookingId, userId, and pickupTime are required',
            code: 'INVALID_REQUEST'
          }
        });
      }

      const pickupDate = new Date(pickupTime);
      if (isNaN(pickupDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid pickup time format',
            code: 'INVALID_DATE'
          }
        });
      }

      const reminderId = notificationService.scheduleRideReminder(
        bookingId,
        userId,
        pickupDate,
        reminderMinutes || 30
      );

      if (!reminderId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Reminder time has already passed',
            code: 'PAST_REMINDER_TIME'
          }
        });
      }

      res.json({
        success: true,
        message: 'Reminder scheduled successfully',
        reminderId,
        scheduledFor: new Date(pickupDate.getTime() - (reminderMinutes || 30) * 60000).toISOString()
      });
    } catch (error) {
      console.error('[NotificationController] Schedule reminder error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to schedule reminder',
          code: 'SCHEDULE_REMINDER_FAILED'
        }
      });
    }
  }

  /**
   * Cancel scheduled reminder
   * DELETE /api/v1/notifications/reminders/:reminderId
   */
  async cancelReminder(req, res) {
    try {
      const { reminderId } = req.params;

      const success = notificationService.cancelReminder(reminderId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Reminder not found',
            code: 'REMINDER_NOT_FOUND'
          }
        });
      }

      res.json({
        success: true,
        message: 'Reminder cancelled successfully'
      });
    } catch (error) {
      console.error('[NotificationController] Cancel reminder error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to cancel reminder',
          code: 'CANCEL_REMINDER_FAILED'
        }
      });
    }
  }

  /**
   * Clear all notifications
   * DELETE /api/v1/notifications
   */
  async clearNotifications(req, res) {
    try {
      const userId = req.user?.userId || req.body.userId || 'test-user';

      const success = notificationService.clearUserNotifications(userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'No notifications found for user',
            code: 'NO_NOTIFICATIONS'
          }
        });
      }

      res.json({
        success: true,
        message: 'All notifications cleared'
      });
    } catch (error) {
      console.error('[NotificationController] Clear notifications error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to clear notifications',
          code: 'CLEAR_NOTIFICATIONS_FAILED'
        }
      });
    }
  }

  /**
   * Get notification statistics
   * GET /api/v1/notifications/stats
   */
  async getStatistics(req, res) {
    try {
      const userId = req.query.userId;

      const stats = notificationService.getStatistics(userId);

      res.json({
        success: true,
        statistics: stats
      });
    } catch (error) {
      console.error('[NotificationController] Get statistics error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch statistics',
          code: 'STATS_FETCH_FAILED'
        }
      });
    }
  }

  /**
   * Test notification channels
   * POST /api/v1/notifications/test
   */
  async testNotifications(req, res) {
    try {
      const { userId = 'test-user' } = req.body;

      // Send test notifications for each type
      const testResults = [];

      // Test in-app notification
      const inAppNotif = await notificationService.sendNotification(
        userId,
        'BOOKING_CONFIRMED',
        {
          bookingId: 'TEST-001',
          pickupTime: new Date(Date.now() + 3600000).toISOString()
        },
        ['in-app']
      );
      testResults.push({ type: 'in-app', success: true, id: inAppNotif.id });

      // Test SMS notification
      const smsNotif = await notificationService.sendNotification(
        userId,
        'DRIVER_ASSIGNED',
        {
          driverName: 'John Doe',
          vehicleNumber: 'KA-01-AB-1234'
        },
        ['sms']
      );
      testResults.push({ type: 'sms', success: true, id: smsNotif.id });

      // Test email notification
      const emailNotif = await notificationService.sendNotification(
        userId,
        'PAYMENT_RECEIVED',
        {
          amount: '5000',
          bookingId: 'TEST-001'
        },
        ['email']
      );
      testResults.push({ type: 'email', success: true, id: emailNotif.id });

      // Test scheduled reminder
      const reminderId = notificationService.scheduleRideReminder(
        'TEST-BOOKING-001',
        userId,
        new Date(Date.now() + 35 * 60000), // 35 minutes from now
        5 // Remind 5 minutes before
      );
      testResults.push({
        type: 'scheduled_reminder',
        success: !!reminderId,
        reminderId,
        willTriggerIn: '30 minutes'
      });

      res.json({
        success: true,
        message: 'Test notifications sent',
        userId,
        results: testResults
      });
    } catch (error) {
      console.error('[NotificationController] Test notifications error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to send test notifications',
          code: 'TEST_FAILED'
        }
      });
    }
  }

  /**
   * Trigger notification for booking status change
   * This would be called internally when booking status changes
   */
  async notifyBookingStatusChange(bookingId, userId, oldStatus, newStatus, additionalData = {}) {
    try {
      let notificationType = null;
      const data = { bookingId, ...additionalData };

      // Map status changes to notification types
      switch (newStatus) {
        case 'confirmed':
          notificationType = 'BOOKING_CONFIRMED';
          break;
        case 'driver_assigned':
          notificationType = 'DRIVER_ASSIGNED';
          break;
        case 'driver_arriving':
          notificationType = 'DRIVER_ARRIVING';
          break;
        case 'pickup_started':
          notificationType = 'PICKUP_STARTED';
          break;
        case 'in_transit':
          notificationType = 'IN_TRANSIT';
          break;
        case 'delivered':
          notificationType = 'DELIVERED';
          break;
        case 'cancelled':
          notificationType = 'BOOKING_CANCELLED';
          break;
        default:
          console.log(`[NotificationController] No notification for status: ${newStatus}`);
          return null;
      }

      if (notificationType) {
        const notification = await notificationService.sendNotification(
          userId,
          notificationType,
          data
        );

        console.log(`[NotificationController] Status change notification sent:`, {
          bookingId,
          userId,
          type: notificationType,
          newStatus
        });

        return notification;
      }

      return null;
    } catch (error) {
      console.error('[NotificationController] Status change notification error:', error);
      // Don't throw - notifications shouldn't break the main flow
      return null;
    }
  }
}

module.exports = new NotificationController();