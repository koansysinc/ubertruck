/**
 * Notification Service
 * Manages in-app, SMS, and email notifications
 * Following Uber/Rapido notification patterns
 */

const EventEmitter = require('events');
const websocketService = require('./websocket');

class NotificationService extends EventEmitter {
  constructor() {
    super();

    // In-memory storage for notifications (would be database in production)
    this.notifications = new Map(); // Map<userId, Array<notification>>
    this.scheduledReminders = new Map(); // Map<reminderId, timeoutId>

    // Notification templates following Uber patterns
    this.templates = {
      // Booking notifications
      BOOKING_CONFIRMED: {
        title: 'Booking Confirmed',
        template: 'Your booking {bookingId} has been confirmed. Pickup scheduled for {pickupTime}',
        channels: ['in-app', 'sms', 'email']
      },
      DRIVER_ASSIGNED: {
        title: 'Driver Assigned',
        template: 'Driver {driverName} ({vehicleNumber}) has been assigned to your booking',
        channels: ['in-app', 'sms', 'push']
      },
      DRIVER_ARRIVING: {
        title: 'Driver Arriving Soon',
        template: 'Your driver is {eta} minutes away',
        channels: ['in-app', 'push']
      },
      PICKUP_STARTED: {
        title: 'Pickup Started',
        template: 'Your shipment pickup has started',
        channels: ['in-app', 'sms']
      },
      IN_TRANSIT: {
        title: 'Shipment In Transit',
        template: 'Your shipment is on the way to {destination}',
        channels: ['in-app', 'email']
      },
      DELIVERED: {
        title: 'Delivery Completed',
        template: 'Your shipment has been delivered successfully',
        channels: ['in-app', 'sms', 'email']
      },

      // Reminder notifications
      RIDE_REMINDER: {
        title: 'Upcoming Pickup',
        template: 'Reminder: Your pickup is scheduled in {timeRemaining} minutes',
        channels: ['in-app', 'sms', 'push']
      },

      // Payment notifications
      PAYMENT_PENDING: {
        title: 'Payment Pending',
        template: 'Payment of ₹{amount} is pending for booking {bookingId}',
        channels: ['in-app', 'email']
      },
      PAYMENT_RECEIVED: {
        title: 'Payment Received',
        template: 'Payment of ₹{amount} received successfully',
        channels: ['in-app', 'email']
      },

      // Status change notifications
      BOOKING_CANCELLED: {
        title: 'Booking Cancelled',
        template: 'Your booking {bookingId} has been cancelled. {reason}',
        channels: ['in-app', 'sms', 'email']
      },
      DELAY_NOTIFICATION: {
        title: 'Delivery Delayed',
        template: 'Your delivery is delayed by approximately {delayTime} minutes due to {reason}',
        channels: ['in-app', 'sms']
      }
    };

    console.log('[NotificationService] Service initialized with', Object.keys(this.templates).length, 'templates');
  }

  /**
   * Send notification to user
   * @param {string} userId - User ID
   * @param {string} type - Notification type from templates
   * @param {object} data - Data to populate template
   * @param {array} channels - Override default channels
   * @returns {object} Notification details
   */
  async sendNotification(userId, type, data = {}, channels = null) {
    const template = this.templates[type];

    if (!template) {
      console.error(`[NotificationService] Unknown notification type: ${type}`);
      throw new Error(`Unknown notification type: ${type}`);
    }

    // Generate notification content
    const content = this.populateTemplate(template.template, data);
    const channelsToUse = channels || template.channels;

    const notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title: template.title,
      content,
      data,
      channels: channelsToUse,
      status: 'pending',
      createdAt: new Date().toISOString(),
      readAt: null
    };

    // Store in-app notification
    if (channelsToUse.includes('in-app')) {
      this.storeInAppNotification(userId, notification);
    }

    // Send via different channels
    const results = {
      'in-app': false,
      'sms': false,
      'email': false,
      'push': false
    };

    for (const channel of channelsToUse) {
      try {
        switch (channel) {
          case 'in-app':
            results['in-app'] = await this.sendInAppNotification(userId, notification);
            break;
          case 'sms':
            results['sms'] = await this.sendSMSNotification(userId, notification);
            break;
          case 'email':
            results['email'] = await this.sendEmailNotification(userId, notification);
            break;
          case 'push':
            results['push'] = await this.sendPushNotification(userId, notification);
            break;
        }
      } catch (error) {
        console.error(`[NotificationService] Failed to send via ${channel}:`, error.message);
      }
    }

    notification.status = 'sent';
    notification.sentChannels = Object.keys(results).filter(ch => results[ch]);

    console.log(`[NotificationService] Notification sent to user ${userId}:`, {
      type,
      channels: notification.sentChannels,
      id: notification.id
    });

    // Emit event for logging/analytics
    this.emit('notification:sent', notification);

    return notification;
  }

  /**
   * Store in-app notification
   * @private
   */
  storeInAppNotification(userId, notification) {
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }

    const userNotifications = this.notifications.get(userId);
    userNotifications.unshift(notification); // Add to beginning

    // Keep only last 100 notifications per user
    if (userNotifications.length > 100) {
      userNotifications.pop();
    }
  }

  /**
   * Send in-app notification via WebSocket
   * @private
   */
  async sendInAppNotification(userId, notification) {
    try {
      // Broadcast via WebSocket if user is connected
      websocketService.broadcastToUser(userId, {
        type: 'notification',
        notification: {
          id: notification.id,
          title: notification.title,
          content: notification.content,
          timestamp: notification.createdAt
        }
      });

      console.log(`[NotificationService] In-app notification sent to user ${userId}`);
      return true;
    } catch (error) {
      console.error('[NotificationService] In-app notification failed:', error);
      return false;
    }
  }

  /**
   * Send SMS notification (mock implementation)
   * In production, integrate with Twilio/MSG91
   */
  async sendSMSNotification(userId, notification) {
    try {
      // Mock SMS sending
      console.log(`[NotificationService] SMS Mock: Sending to user ${userId}`);
      console.log(`  Content: ${notification.content}`);

      // In production:
      // const twilioClient = require('twilio')(accountSid, authToken);
      // await twilioClient.messages.create({
      //   body: notification.content,
      //   from: '+1234567890',
      //   to: userPhoneNumber
      // });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));

      return true;
    } catch (error) {
      console.error('[NotificationService] SMS notification failed:', error);
      return false;
    }
  }

  /**
   * Send email notification (mock implementation)
   * In production, integrate with SendGrid/SES
   */
  async sendEmailNotification(userId, notification) {
    try {
      // Mock email sending
      console.log(`[NotificationService] Email Mock: Sending to user ${userId}`);
      console.log(`  Subject: ${notification.title}`);
      console.log(`  Body: ${notification.content}`);

      // In production:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // await sgMail.send({
      //   to: userEmail,
      //   from: 'noreply@ubertruck.com',
      //   subject: notification.title,
      //   text: notification.content,
      //   html: this.generateEmailHTML(notification)
      // });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 150));

      return true;
    } catch (error) {
      console.error('[NotificationService] Email notification failed:', error);
      return false;
    }
  }

  /**
   * Send push notification (mock implementation)
   * In production, integrate with FCM/APNS
   */
  async sendPushNotification(userId, notification) {
    try {
      // Mock push notification
      console.log(`[NotificationService] Push Mock: Sending to user ${userId}`);
      console.log(`  Title: ${notification.title}`);
      console.log(`  Body: ${notification.content}`);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 50));

      return true;
    } catch (error) {
      console.error('[NotificationService] Push notification failed:', error);
      return false;
    }
  }

  /**
   * Schedule a ride reminder
   * @param {string} bookingId - Booking ID
   * @param {string} userId - User ID
   * @param {Date} pickupTime - Scheduled pickup time
   * @param {number} reminderMinutes - Minutes before pickup to send reminder
   * @returns {string} Reminder ID
   */
  scheduleRideReminder(bookingId, userId, pickupTime, reminderMinutes = 30) {
    const reminderId = `reminder-${bookingId}-${reminderMinutes}`;

    // Cancel existing reminder if any
    if (this.scheduledReminders.has(reminderId)) {
      clearTimeout(this.scheduledReminders.get(reminderId));
    }

    // Calculate when to send reminder
    const reminderTime = new Date(pickupTime);
    reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes);

    const delay = reminderTime.getTime() - Date.now();

    if (delay <= 0) {
      console.log(`[NotificationService] Reminder time has passed for booking ${bookingId}`);
      return null;
    }

    // Schedule the reminder
    const timeoutId = setTimeout(() => {
      this.sendNotification(userId, 'RIDE_REMINDER', {
        bookingId,
        timeRemaining: reminderMinutes,
        pickupTime: pickupTime.toISOString()
      });

      // Clean up
      this.scheduledReminders.delete(reminderId);

      console.log(`[NotificationService] Reminder sent for booking ${bookingId}`);
    }, delay);

    this.scheduledReminders.set(reminderId, timeoutId);

    console.log(`[NotificationService] Reminder scheduled for booking ${bookingId}:`, {
      reminderId,
      pickupTime: pickupTime.toISOString(),
      reminderTime: reminderTime.toISOString(),
      delayMs: delay
    });

    return reminderId;
  }

  /**
   * Cancel a scheduled reminder
   * @param {string} reminderId - Reminder ID
   * @returns {boolean} Success status
   */
  cancelReminder(reminderId) {
    if (!this.scheduledReminders.has(reminderId)) {
      return false;
    }

    clearTimeout(this.scheduledReminders.get(reminderId));
    this.scheduledReminders.delete(reminderId);

    console.log(`[NotificationService] Reminder cancelled: ${reminderId}`);
    return true;
  }

  /**
   * Get user's notifications
   * @param {string} userId - User ID
   * @param {number} limit - Maximum notifications to return
   * @param {boolean} unreadOnly - Return only unread notifications
   * @returns {array} User notifications
   */
  getUserNotifications(userId, limit = 20, unreadOnly = false) {
    const userNotifications = this.notifications.get(userId) || [];

    let filtered = userNotifications;
    if (unreadOnly) {
      filtered = userNotifications.filter(n => !n.readAt);
    }

    return filtered.slice(0, limit);
  }

  /**
   * Mark notification as read
   * @param {string} userId - User ID
   * @param {string} notificationId - Notification ID
   * @returns {boolean} Success status
   */
  markAsRead(userId, notificationId) {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) {
      return false;
    }

    const notification = userNotifications.find(n => n.id === notificationId);
    if (!notification) {
      return false;
    }

    notification.readAt = new Date().toISOString();

    console.log(`[NotificationService] Notification marked as read:`, {
      userId,
      notificationId
    });

    return true;
  }

  /**
   * Mark all notifications as read
   * @param {string} userId - User ID
   * @returns {number} Number of notifications marked
   */
  markAllAsRead(userId) {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) {
      return 0;
    }

    let count = 0;
    const now = new Date().toISOString();

    userNotifications.forEach(notification => {
      if (!notification.readAt) {
        notification.readAt = now;
        count++;
      }
    });

    console.log(`[NotificationService] Marked ${count} notifications as read for user ${userId}`);
    return count;
  }

  /**
   * Clear user notifications
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  clearUserNotifications(userId) {
    if (!this.notifications.has(userId)) {
      return false;
    }

    const count = this.notifications.get(userId).length;
    this.notifications.delete(userId);

    console.log(`[NotificationService] Cleared ${count} notifications for user ${userId}`);
    return true;
  }

  /**
   * Populate template with data
   * @private
   */
  populateTemplate(template, data) {
    let content = template;

    // Replace placeholders with actual values
    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      const value = data[key];
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    return content;
  }

  /**
   * Get notification statistics
   * @param {string} userId - User ID (optional)
   * @returns {object} Statistics
   */
  getStatistics(userId = null) {
    if (userId) {
      const userNotifications = this.notifications.get(userId) || [];
      const unread = userNotifications.filter(n => !n.readAt).length;

      return {
        total: userNotifications.length,
        unread,
        read: userNotifications.length - unread,
        scheduledReminders: Array.from(this.scheduledReminders.keys())
          .filter(id => id.includes(userId)).length
      };
    }

    // Global statistics
    let totalNotifications = 0;
    let totalUnread = 0;

    this.notifications.forEach(userNotifications => {
      totalNotifications += userNotifications.length;
      totalUnread += userNotifications.filter(n => !n.readAt).length;
    });

    return {
      totalUsers: this.notifications.size,
      totalNotifications,
      totalUnread,
      totalRead: totalNotifications - totalUnread,
      activeReminders: this.scheduledReminders.size
    };
  }

  /**
   * Clean up old notifications (housekeeping)
   * @param {number} daysToKeep - Number of days to keep notifications
   * @returns {number} Number of notifications deleted
   */
  cleanupOldNotifications(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let totalDeleted = 0;

    this.notifications.forEach((userNotifications, userId) => {
      const before = userNotifications.length;

      // Keep only recent notifications
      const filtered = userNotifications.filter(n => {
        const createdAt = new Date(n.createdAt);
        return createdAt > cutoffDate;
      });

      this.notifications.set(userId, filtered);
      totalDeleted += (before - filtered.length);
    });

    console.log(`[NotificationService] Cleanup: Deleted ${totalDeleted} old notifications`);
    return totalDeleted;
  }
}

module.exports = new NotificationService();