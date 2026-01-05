const mongoose = require('mongoose');

/**
 * Notification Log Model
 * Tracks all notifications sent for analytics and debugging
 */
const notificationLogSchema = new mongoose.Schema({
  locationId: {
    type: String,
    required: true,
    index: true
  },
  
  contactId: String,
  conversationId: String,
  messageId: String,
  
  // Notification details
  channel: {
    type: String,
    enum: ['push', 'email', 'slack'],
    required: true
  },
  
  status: {
    type: String,
    enum: ['sent', 'failed', 'clicked'],
    default: 'sent'
  },
  
  error: String,
  
  // Context
  isPriority: {
    type: Boolean,
    default: false
  },
  
  wasFiltered: {
    type: Boolean,
    default: false
  },
  
  filterReason: {
    type: String,
    enum: ['business_hours', 'no_channels', 'no_preference', 'test_mode', null],
    default: null
  },
  
  // Metadata
  messagePreview: String, // First 100 chars of message
  
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7776000 // TTL: 90 days (auto-delete old logs)
  }
});

// Indexes for analytics queries
notificationLogSchema.index({ locationId: 1, createdAt: -1 });
notificationLogSchema.index({ channel: 1, status: 1 });
notificationLogSchema.index({ createdAt: 1 }); // TTL index

// Static methods for analytics
notificationLogSchema.statics.getStatsByLocation = async function(locationId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        locationId,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          channel: '$channel',
          status: '$status'
        },
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('NotificationLog', notificationLogSchema);

