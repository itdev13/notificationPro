const { Queue } = require('bullmq');
const Redis = require('ioredis');

/**
 * Notification Queue Setup
 * Uses BullMQ for reliable job processing
 */

// Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Create notification queue
const notificationQueue = new Queue('notifications', {
  connection,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000 // Start with 2 second delay, then 4s, then 8s
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000 // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600 // Keep failed jobs for 7 days
    }
  }
});

// Queue events
notificationQueue.on('error', (error) => {
  console.error('❌ Queue error:', error);
});

module.exports = notificationQueue;

