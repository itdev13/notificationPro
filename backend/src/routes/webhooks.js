const express = require('express');
const router = express.Router();
const notificationQueue = require('../queues/notificationQueue');
const logger = require('../utils/logger');

/**
 * Webhook Routes
 * Receives webhooks from GHL
 */

/**
 * Handle InboundMessage webhook
 * Triggered when a contact sends a message
 */
router.post('/inbound-message', async (req, res) => {
  try {
    const webhookData = req.body;
    
    logger.info('📨 Inbound message webhook received:', {
      locationId: webhookData.locationId,
      contactId: webhookData.contactId,
      type: webhookData.type
    });

    // Extract message data
    const messageData = {
      locationId: webhookData.locationId,
      contactId: webhookData.contactId,
      conversationId: webhookData.conversationId,
      messageId: webhookData.messageId,
      message: {
        text: webhookData.body || webhookData.message || webhookData.text,
        type: webhookData.type
      },
      contactName: webhookData.contactName || 
                   (webhookData.contact?.name) || 
                   'Unknown Contact',
      timestamp: webhookData.dateAdded || new Date().toISOString()
    };

    // Add job to queue (don't wait for processing)
    await notificationQueue.add('process-notification', messageData, {
      priority: 1 // Normal priority
    });

    logger.info('✅ Notification queued successfully');

    // Respond immediately to GHL
    res.status(200).json({ 
      success: true,
      message: 'Notification queued'
    });
    
  } catch (error) {
    logger.error('Webhook error:', error);
    
    // Still return 200 to GHL to prevent retries
    res.status(200).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Handle ConversationUnread webhook (optional)
 * Could be used for notification counts
 */
router.post('/conversation-unread', async (req, res) => {
  try {
    logger.info('📬 Conversation unread webhook received');
    // Handle if needed for future features
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(200).json({ success: false });
  }
});

/**
 * Webhook health check
 */
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'webhooks',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

