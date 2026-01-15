const express = require('express');
const router = express.Router();
const { addJob, isAvailable } = require('../queues/notificationQueue');
const logger = require('../utils/logger');

/**
 * Webhook Routes
 * Receives webhooks from GHL
 */

/**
 * Unified webhook handler - Supports multiple webhook types
 */
router.post('/unified', async (req, res) => {
  try {
    const webhookData = req.body;
    const webhookType = webhookData.type;
    
    logger.info(`📨 Webhook received: ${webhookType}`, {
      locationId: webhookData.locationId,
      type: webhookType
    });

    let notificationData = null;

    // Handle different webhook types
    switch (webhookType) {
      case 'InboundMessage':
        notificationData = await handleInboundMessage(webhookData);
        break;
      
      case 'TaskComplete':
      case 'TaskCreate':
      case 'TaskDelete':
        notificationData = await handleTaskWebhook(webhookData);
        break;
      
      default:
        logger.warn(`Unsupported webhook type: ${webhookType}`);
        return res.status(200).json({ 
          success: false,
          message: 'Webhook type not supported yet'
        });
    }

    if (!notificationData) {
      return res.status(200).json({ 
        success: false,
        message: 'No notification data generated'
      });
    }

    // Add job to queue
    const job = await addJob('process-notification', notificationData, {
      priority: notificationData.isPriority ? 10 : 1
    });

    if (job) {
      logger.info('✅ Notification queued successfully');
    } else {
      logger.warn('⚠️ Notification not queued - Redis unavailable');
    }

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
 * Handle InboundMessage webhook
 * Fetches contact to get assignedTo (userId) and contactName
 */
async function handleInboundMessage(webhookData) {
  const ghlService = require('../services/ghlService');
  
  try {
    // Fetch contact to get assignedTo user and contact name
    logger.info('Fetching contact for assignedTo userId and name...');
    const contact = await ghlService.getContact(
      webhookData.locationId,
      webhookData.contactId
    );

    const assignedUserId = contact?.assignedTo || null;
    const contactName = contact?.name || webhookData.contactName || 'Unknown Contact';
    
    if (!assignedUserId) {
      logger.warn('❌ No assignedTo user for this contact - SKIPPING notification (unassigned contact)');
      return null; // Skip notification if contact not assigned to anyone
    }

    logger.info(`✅ Contact "${contactName}" assigned to user: ${assignedUserId}`);

    return {
      locationId: webhookData.locationId,
      userId: assignedUserId, // CRITICAL: Only notify assigned user
      contactId: webhookData.contactId,
      conversationId: webhookData.conversationId,
      messageId: webhookData.messageId,
      message: {
        text: webhookData.body || webhookData.message || '',
        type: webhookData.messageType || webhookData.type
      },
      contactName: contactName, // From GHL API (more reliable)
      timestamp: webhookData.dateAdded || new Date().toISOString(),
      webhookType: 'InboundMessage'
    };
  } catch (error) {
    logger.error('Error handling InboundMessage:', error);
    throw error;
  }
}

/**
 * Handle Task webhooks (TaskComplete, TaskCreate, TaskDelete)
 * Uses assignedTo field directly
 */
async function handleTaskWebhook(webhookData) {
  try {
    const assignedUserId = webhookData.assignedTo || null;
    
    if (!assignedUserId) {
      logger.warn('❌ No assignedTo user for task - SKIPPING notification');
      return null; // Skip notification if not assigned
    }

    logger.info(`✅ Task assigned to user: ${assignedUserId}`);

    const taskAction = webhookData.type.replace('Task', ''); // Complete, Create, Delete

    return {
      locationId: webhookData.locationId,
      userId: assignedUserId, // CRITICAL: Only notify assigned user
      contactId: webhookData.contactId,
      conversationId: null, // Tasks don't have conversation
      messageId: webhookData.id, // Task ID
      message: {
        text: `Task ${taskAction}: ${webhookData.title || 'Untitled'}\n${webhookData.body || ''}`,
        type: webhookData.type
      },
      contactName: 'Task Notification',
      timestamp: webhookData.dateAdded || new Date().toISOString(),
      webhookType: webhookData.type,
      taskData: {
        taskId: webhookData.id,
        title: webhookData.title,
        body: webhookData.body,
        dueDate: webhookData.dueDate,
        action: taskAction
      }
    };
  } catch (error) {
    logger.error('Error handling task webhook:', error);
    throw error;
  }
}

/**
 * Legacy endpoint - redirects to unified
 */
router.post('/inbound-message', async (req, res) => {
  req.body.type = req.body.type || 'InboundMessage';
  return router.handle(req, res);
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

