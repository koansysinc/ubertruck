/**
 * Notification Routes
 * PHASE 4: Notification System
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../utils/auth');

// Get user notifications
router.get('/', notificationController.getUserNotifications);

// Get notification statistics
router.get('/stats', notificationController.getStatistics);

// Send notification (for testing/admin)
router.post('/send', notificationController.sendNotification);

// Test all notification channels
router.post('/test', notificationController.testNotifications);

// Schedule ride reminder
router.post('/schedule-reminder', notificationController.scheduleReminder);

// Mark notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Cancel scheduled reminder
router.delete('/reminders/:reminderId', notificationController.cancelReminder);

// Clear all notifications
router.delete('/', notificationController.clearNotifications);

module.exports = router;