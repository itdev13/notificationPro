const { Worker } = require('bullmq');
const Redis = require('ioredis');
const NotificationPreference = require('../models/NotificationPreference');
const NotificationLog = require('../models/NotificationLog');
const pushService = require('../services/pushService');
const emailService = require('../services/emailService');
const slackService = require('../services/slackService');
const filterService = require('../services/filterService');
const logger = require('../utils/logger');

/**
 * Notification Worker
 * Processes notification jobs from the queue
 */

// Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Worker
const worker = new Worker(
  'notifications',
  async (job) => {
    const { locationId, contactId, conversationId, messageId, message, contactName } = job.data;
    
    logger.info(`Processing notification job for location: ${locationId}`);

    try {
      // 1. Load preferences
      const preferences = await NotificationPreference.findByLocation(locationId);
      
      // 2. Apply filters
      const decision = filterService.shouldNotify(preferences, message);
      
      if (!decision.notify) {
        logger.info(`Notification filtered: ${decision.reason}`);
        
        // Log filtered notification
        await NotificationLog.create({
          locationId,
          contactId,
          conversationId,
          messageId,
          channel: 'none',
          status: 'sent',
          wasFiltered: true,
          filterReason: decision.reason,
          messagePreview: message.text?.substring(0, 100)
        });
        
        return { filtered: true, reason: decision.reason };
      }

      // 3. Prepare payload
      const payload = {
        title: `New message from ${contactName}`,
        body: message.text || message.body || '',
        contactName,
        url: filterService.buildConversationUrl(locationId, conversationId),
        conversationId,
        contactId,
        isPriority: decision.isPriority
      };

      // 4. Send to all enabled channels
      const results = {
        push: null,
        email: null,
        slack: null
      };

      // Send push notifications
      if (preferences.channels.push.enabled) {
        try {
          results.push = await pushService.sendToLocation(locationId, payload);
          
          await NotificationLog.create({
            locationId,
            contactId,
            conversationId,
            messageId,
            channel: 'push',
            status: 'sent',
            isPriority: decision.isPriority,
            messagePreview: payload.body.substring(0, 100)
          });
        } catch (error) {
          logger.error('Push notification failed:', error);
          
          await NotificationLog.create({
            locationId,
            contactId,
            conversationId,
            messageId,
            channel: 'push',
            status: 'failed',
            error: error.message,
            isPriority: decision.isPriority
          });
        }
      }

      // Send email notifications
      if (preferences.channels.email.enabled && preferences.channels.email.address) {
        try {
          results.email = await emailService.send(preferences.channels.email.address, payload);
          
          await NotificationLog.create({
            locationId,
            contactId,
            conversationId,
            messageId,
            channel: 'email',
            status: 'sent',
            isPriority: decision.isPriority,
            messagePreview: payload.body.substring(0, 100)
          });
        } catch (error) {
          logger.error('Email notification failed:', error);
          
          await NotificationLog.create({
            locationId,
            contactId,
            conversationId,
            messageId,
            channel: 'email',
            status: 'failed',
            error: error.message,
            isPriority: decision.isPriority
          });
        }
      }

      // Send Slack notifications
      if (preferences.channels.slack.enabled && preferences.channels.slack.webhookUrl) {
        try {
          results.slack = await slackService.send(preferences.channels.slack.webhookUrl, payload);
          
          await NotificationLog.create({
            locationId,
            contactId,
            conversationId,
            messageId,
            channel: 'slack',
            status: 'sent',
            isPriority: decision.isPriority,
            messagePreview: payload.body.substring(0, 100)
          });
        } catch (error) {
          logger.error('Slack notification failed:', error);
          
          await NotificationLog.create({
            locationId,
            contactId,
            conversationId,
            messageId,
            channel: 'slack',
            status: 'failed',
            error: error.message,
            isPriority: decision.isPriority
          });
        }
      }

      logger.info('✅ Notification processing complete:', results);
      
      return results;
    } catch (error) {
      logger.error('Worker error:', error);
      throw error; // Will trigger retry
    }
  },
  {
    connection,
    concurrency: 5, // Process 5 jobs simultaneously
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000 // per second
    }
  }
);

// Worker events
worker.on('completed', (job) => {
  logger.info(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, error) => {
  logger.error(`❌ Job ${job.id} failed:`, error.message);
});

logger.info('🔄 Notification worker started');

module.exports = worker;

