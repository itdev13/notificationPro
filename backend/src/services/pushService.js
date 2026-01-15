const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const NotificationPreference = require('../models/NotificationPreference');
const logger = require('../utils/logger');

/**
 * Push Notification Service
 * Sends browser push notifications using Web Push API
 */
class PushService {
  constructor() {
    this.vapidConfigured = false;
  }

  /**
   * Initialize VAPID details (lazy initialization)
   */
  initializeVapid() {
    if (this.vapidConfigured) {
      return;
    }

    const subject = process.env.VAPID_SUBJECT;
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!subject || !publicKey || !privateKey) {
      throw new Error('VAPID keys not configured. Please set VAPID_SUBJECT, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY in .env file');
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.vapidConfigured = true;
  }

  /**
   * Send push notification to specific user's subscription
   * Only sends to the user's active device (one device per user)
   */
  async sendToUser(locationId, userId, payload) {
    try {
      // Initialize VAPID if not already done
      this.initializeVapid();

      // Get user's active subscription (should only be one)
      const subscription = await PushSubscription.findActiveByUser(locationId, userId);
      
      if (!subscription) {
        logger.warn(`No active push subscription for user ${userId} in location ${locationId}`);
        return { sent: 0, failed: 0 };
      }

      logger.info(`Sending push to user ${userId} on ${subscription.deviceInfo?.browser || 'unknown device'}`);

      // Prepare notification payload
      const notificationPayload = JSON.stringify({
        title: payload.title || 'New Message',
        body: payload.body || '',
        icon: payload.icon || '/icon.png',
        badge: payload.badge || '/badge.png',
        data: {
          url: payload.url || '',
          conversationId: payload.conversationId,
          contactId: payload.contactId
        },
        tag: 'conversation-notification-' + Date.now(),
        requireInteraction: payload.isPriority || false
      });

      console.log('notificationPayload', notificationPayload);

      // Send to user's subscription
      try {
        await this.sendToSubscription(subscription, notificationPayload);
        logger.info(`✅ Push sent to user ${userId}`);
        return { sent: 1, failed: 0 };
      } catch (error) {
        logger.error(`❌ Push failed for user ${userId}:`, error.message);
        return { sent: 0, failed: 1 };
      }

    } catch (error) {
      logger.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Send push notification to all subscriptions for a location (Legacy - for testing)
   */
  async sendToLocation(locationId, payload) {
    try {
      // Initialize VAPID if not already done
      this.initializeVapid();

      // Get all active subscriptions
      const subscriptions = await PushSubscription.findActiveByLocation(locationId);
      
      if (subscriptions.length === 0) {
        logger.warn(`No active push subscriptions for location: ${locationId}`);
        return { sent: 0, failed: 0 };
      }

      // Prepare notification payload
      const notificationPayload = JSON.stringify({
        title: payload.title || 'New Message',
        body: payload.body || '',
        icon: payload.icon || '/icon.png',
        badge: payload.badge || '/badge.png',
        data: {
          url: payload.url || '',
          conversationId: payload.conversationId,
          contactId: payload.contactId
        },
        tag: 'conversation-notification-' + Date.now(),
        requireInteraction: payload.isPriority || false
      });

      console.log('notificationPayload', notificationPayload);

      // Send to all subscriptions
      const results = await Promise.allSettled(
        subscriptions.map(sub => this.sendToSubscription(sub, notificationPayload))
      );

      // Count successes and failures
      const sent = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info(`Push notifications sent: ${sent} succeeded, ${failed} failed`);

      return { sent, failed };
    } catch (error) {
      logger.error('Error sending push notifications:', error);
      throw error;
    }
  }

  /**
   * Send to a single subscription
   */
  async sendToSubscription(pushSub, payload) {
    try {
      // Initialize VAPID if not already done
      this.initializeVapid();

      await webpush.sendNotification(pushSub.subscription, payload);
      
      // Update last used timestamp
      await pushSub.updateLastUsed();
      
      return { success: true };
    } catch (error) {
      // Handle errors (expired subscription, invalid endpoint, etc.)
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription expired or invalid - mark as expired
        logger.warn(`Push subscription expired (${error.statusCode}): ${pushSub.subscription.endpoint}`);
        await PushSubscription.markAsExpired(
          pushSub.subscription.endpoint,
          error.statusCode === 410 ? 'subscription_expired' : 'endpoint_not_found'
        );
      } else {
        logger.error('Push notification error:', error);
      }
      
      throw error;
    }
  }

  /**
   * Test notification
   */
  async sendTestNotification(locationId) {
    return await this.sendToLocation(locationId, {
      title: '🔔 NotifyPro Test',
      body: 'This is a test notification. If you see this, notifications are working!',
      icon: '/icon.png',
      url: 'https://app.gohighlevel.com',
      isPriority: false
    });
  }
}

module.exports = new PushService();

