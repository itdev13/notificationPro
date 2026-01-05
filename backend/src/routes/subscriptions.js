const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const PushSubscription = require('../models/PushSubscription');
const pushService = require('../services/pushService');
const logger = require('../utils/logger');

/**
 * Push Subscription Routes
 * Manage browser push notification subscriptions
 */

/**
 * Get VAPID public key for client
 */
router.get('/vapid-public-key', (req, res) => {
  res.json({
    success: true,
    publicKey: process.env.VAPID_PUBLIC_KEY
  });
});

/**
 * Subscribe to push notifications
 */
router.post('/subscribe', [
  body('locationId').notEmpty().withMessage('locationId is required'),
  body('subscription').isObject().withMessage('subscription object is required'),
  body('subscription.endpoint').notEmpty().withMessage('subscription.endpoint is required'),
  body('subscription.keys.p256dh').notEmpty().withMessage('subscription.keys.p256dh is required'),
  body('subscription.keys.auth').notEmpty().withMessage('subscription.keys.auth is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { locationId, userId, subscription, userAgent } = req.body;

    // Save or update subscription
    const pushSub = await PushSubscription.findOneAndUpdate(
      { 'subscription.endpoint': subscription.endpoint },
      {
        locationId,
        userId: userId || null,
        subscription,
        userAgent,
        isActive: true,
        lastUsedAt: new Date()
      },
      {
        upsert: true,
        new: true
      }
    );

    logger.info(`✅ Push subscription saved for location: ${locationId}`);

    res.json({
      success: true,
      message: 'Subscription saved successfully',
      subscriptionId: pushSub._id
    });
    
  } catch (error) {
    logger.error('Error saving subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Unsubscribe from push notifications
 */
router.post('/unsubscribe', [
  body('endpoint').notEmpty().withMessage('endpoint is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { endpoint } = req.body;

    await PushSubscription.deactivateByEndpoint(endpoint);

    logger.info(`✅ Push subscription deactivated: ${endpoint}`);

    res.json({
      success: true,
      message: 'Unsubscribed successfully'
    });
    
  } catch (error) {
    logger.error('Error unsubscribing:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Send test notification
 */
router.post('/test', [
  body('locationId').notEmpty().withMessage('locationId is required'),
  body('channel').isIn(['push', 'email', 'slack']).withMessage('Invalid channel')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { locationId, channel } = req.body;

    let result;

    switch (channel) {
      case 'push':
        result = await pushService.sendTestNotification(locationId);
        break;
      
      case 'email':
        const preferences = await NotificationPreference.findByLocation(locationId);
        if (!preferences?.channels.email.address) {
          return res.status(400).json({
            success: false,
            error: 'No email address configured'
          });
        }
        result = await require('../services/emailService').sendTest(preferences.channels.email.address);
        break;
      
      case 'slack':
        const prefs = await NotificationPreference.findByLocation(locationId);
        if (!prefs?.channels.slack.webhookUrl) {
          return res.status(400).json({
            success: false,
            error: 'No Slack webhook configured'
          });
        }
        result = await require('../services/slackService').sendTest(prefs.channels.slack.webhookUrl);
        break;
    }

    res.json({
      success: true,
      message: `Test ${channel} notification sent`,
      result
    });
    
  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

