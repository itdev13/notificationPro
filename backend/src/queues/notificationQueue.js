const amqp = require('amqplib');
const logger = require('../utils/logger');

/**
 * Notification Queue Setup
 * Uses RabbitMQ for reliable job processing
 */

let connection = null;
let channel = null;
let queueName = 'notifications';
let rabbitAvailable = false;

/**
 * Initialize RabbitMQ connection and queue
 */
async function initializeQueue() {
  if (connection) {
    return { connection, channel, queueName };
  }

  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    
    logger.info(`Connecting to RabbitMQ: ${rabbitUrl.replace(/:[^:]*@/, ':****@')}`);
    
    connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();
    
    // Declare queue with dead letter exchange for failed messages
    await channel.assertQueue(queueName, {
      durable: true, // Queue survives broker restart
      maxPriority: 10, // Support priority levels 0-10
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
    
    rabbitAvailable = true;
    logger.info('✅ RabbitMQ connected - Queue features enabled');
    
    // Handle connection errors
    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error:', err.message);
      rabbitAvailable = false;
    });
    
    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
      rabbitAvailable = false;
      connection = null;
      channel = null;
    });
    
    return { connection, channel, queueName };
  } catch (error) {
    logger.warn('⚠️ RabbitMQ not available - Queue features disabled. Notifications will not be processed.');
    logger.warn('   To enable: Install and start RabbitMQ, or set RABBITMQ_URL environment variable');
    logger.warn(`   Error: ${error.message}`);
    rabbitAvailable = false;
    return null;
  }
}

/**
 * Add job to queue
 */
async function addJob(jobName, data, options = {}) {
  try {
    const queue = await initializeQueue();
    
    if (!queue || !rabbitAvailable) {
      logger.warn('⚠️ Queue unavailable - job not queued. RabbitMQ may not be running.');
      return null;
    }
    
    const { channel, queueName } = queue;
    
    const message = JSON.stringify({
      jobName,
      data,
      timestamp: new Date().toISOString(),
      attempts: 0
    });
    
    const priority = options.priority || 5; // Default priority 5 (0-10)
    
    const sent = channel.sendToQueue(queueName, Buffer.from(message), {
      persistent: true, // Message survives broker restart
      priority: priority
    });
    
    if (sent) {
      logger.debug(`Job added to queue: ${jobName}`);
      return { id: Date.now().toString(), jobName, data };
    } else {
      logger.warn('Queue buffer full - job not queued');
      return null;
    }
  } catch (error) {
    logger.error('Failed to add job to queue:', error.message);
    return null;
  }
}

/**
 * Get queue channel (for worker)
 */
async function getChannel() {
  const queue = await initializeQueue();
  return queue ? queue.channel : null;
}

/**
 * Get queue name
 */
function getQueueName() {
  return queueName;
}

/**
 * Check if RabbitMQ is available
 */
function isAvailable() {
  return rabbitAvailable;
}

// Initialize on module load
initializeQueue().catch(err => {
  logger.error('Failed to initialize queue:', err.message);
});

module.exports = {
  addJob,
  getChannel,
  getQueueName,
  isAvailable,
  initializeQueue
};
