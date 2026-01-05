const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const logger = require('../utils/logger');

/**
 * Push Notification Service
 * Sends browser push notifications using Web Push API
 */
class PushService {
  constructor() {
    // Configure VAPID keys
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  /**
   * Send push notification to all subscriptions for a location
   */
  async sendToLocation(locationId, payload) {
    try {
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
        tag: 'conversation-notification',
        requireInteraction: payload.isPriority || false
      });

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
      await webpush.sendNotification(pushSub.subscription, payload);
      
      // Update last used timestamp
      await pushSub.updateLastUsed();
      
      return { success: true };
    } catch (error) {
      // Handle errors (expired subscription, invalid endpoint, etc.)
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription expired or invalid - deactivate it
        logger.warn(`Push subscription expired: ${pushSub.subscription.endpoint}`);
        await PushSubscription.deactivateByEndpoint(pushSub.subscription.endpoint);
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

