const amqp = require('amqplib');
const mongoose = require('mongoose');
const NotificationPreference = require('../models/NotificationPreference');
const NotificationLog = require('../models/NotificationLog');
const pushService = require('../services/pushService');
const emailService = require('../services/emailService');
const slackService = require('../services/slackService');
const filterService = require('../services/filterService');
const logger = require('../utils/logger');
require('dotenv').config();

/**
 * Notification Worker
 * Simple publish/listen pattern with RabbitMQ
 * RabbitMQ handles retries and dead letter queue automatically
 */

let connection = null;
let channel = null;
let isRunning = false;

/**
 * Process a single notification job
 */
async function processJob(jobData) {
  const { locationId, userId, contactId, conversationId, messageId, message, contactName, webhookType } = jobData;
  
  // Skip if no userId (not assigned to anyone)
  if (!userId) {
    logger.warn(`⚠️ No userId in job data - notification skipped (not assigned)`);
    return { skipped: true, reason: 'no_user_assigned' };
  }

  logger.info(`Processing notification for ${webhookType || 'message'}:`, {
    location: locationId,
    user: userId,
    type: webhookType
  });

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

    // Send push notifications (only to assigned user)
    if (preferences.channels.push.enabled && userId) {
      try {
        results.push = await pushService.sendToUser(locationId, userId, payload);
        
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
    throw error; // Let RabbitMQ handle retries
  }
}

/**
 * Connect to MongoDB
 */
async function connectDatabase() {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/notification-pro';
    
    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    logger.info('✅ Worker connected to MongoDB');
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

/**
 * Start the worker - Simple publish/listen pattern
 */
async function startWorker() {
  if (isRunning) {
    logger.warn('Worker is already running');
    return;
  }

  try {
    // Connect to MongoDB first
    await connectDatabase();
    
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    const queueName = 'notifications';
    const prefetchCount = 5; // Process 5 jobs concurrently
    
    logger.info(`Connecting to RabbitMQ: ${rabbitUrl.replace(/:[^:]*@/, ':****@')}`);
    
    connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();
    
    // Declare queue with dead letter exchange for failed messages
    await channel.assertQueue(queueName, {
      durable: true, // Queue survives broker restart
      maxPriority: 10, // Support priority 0-10
      arguments: {
        // Dead letter exchange - failed messages go here
        'x-dead-letter-exchange': 'notifications-dlx',
        'x-dead-letter-routing-key': 'failed'
      }
    });
    
    // Set up dead letter exchange for failed messages
    await channel.assertExchange('notifications-dlx', 'direct', { durable: true });
    await channel.assertQueue('notifications-failed', { durable: true });
    await channel.bindQueue('notifications-failed', 'notifications-dlx', 'failed');
    
    // Set prefetch to limit concurrent processing
    await channel.prefetch(prefetchCount);
    
    logger.info('🔄 Notification worker started');
    logger.info(`   Queue: ${queueName}`);
    logger.info(`   Prefetch: ${prefetchCount} jobs`);
    logger.info(`   Dead Letter Queue: notifications-failed`);
    
    isRunning = true;
    
    // Handle connection errors
    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error:', err.message);
      isRunning = false;
    });
    
    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed. Attempting to reconnect...');
      isRunning = false;
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (!isRunning) {
          startWorker().catch(err => {
            logger.error('Failed to reconnect worker:', err.message);
          });
        }
      }, 5000);
    });
    
    // Simple consume - just listen and process
    await channel.consume(queueName, async (msg) => {
      if (!msg) {
        return;
      }
      
      try {
        const jobData = JSON.parse(msg.content.toString());
        const { data } = jobData;
        
        logger.debug(`Processing job: ${jobData.jobName || 'notification'}`);
        
        // Process the job
        await processJob(data);
        
        // Acknowledge message - success (removes from queue)
        channel.ack(msg);
        
      } catch (error) {
        logger.error('Error processing job:', error.message);
        
        // Get retry count from message headers (if set)
        const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
        const maxRetries = 3;
        
        if (retryCount < maxRetries) {
          // Reject and requeue - RabbitMQ will handle it
          logger.info(`Re-queuing job (attempt ${retryCount}/${maxRetries})`);
          
          // Reject with requeue = true (RabbitMQ will put it back in queue)
          channel.nack(msg, false, true);
        } else {
          // Max retries reached - reject without requeue
          // RabbitMQ will send to dead letter queue (configured in queue args)
          logger.error(`Job failed after ${maxRetries} attempts. Moving to dead letter queue.`);
          channel.nack(msg, false, false); // No requeue - goes to DLQ
        }
      }
    }, {
      noAck: false // Manual acknowledgment
    });
    
  } catch (error) {
    logger.error('Failed to start worker:', error.message);
    logger.warn('⚠️ Worker will not start. RabbitMQ may not be available.');
    logger.warn('   To enable: Install and start RabbitMQ, or set RABBITMQ_URL environment variable');
    isRunning = false;
  }
}

// Start worker when module is loaded
if (require.main === module) {
  startWorker().catch(err => {
    logger.error('Worker startup failed:', err);
    process.exit(1);
  });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down worker...');
    isRunning = false;
    if (channel) await channel.close();
    if (connection) await connection.close();
    await mongoose.connection.close();
    logger.info('Worker shutdown complete');
    process.exit(0);
  });
}

module.exports = { startWorker, processJob };
