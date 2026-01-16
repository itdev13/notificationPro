const mongoose = require('mongoose');

/**
 * Lightweight Analytics Model for NotifyPro
 * Tracks basic usage metrics
 */
const analyticsSchema = new mongoose.Schema({
  locationId: {
    type: String,
    required: true,
    index: true
  },
  
  userId: {
    type: String,
    required: true,
    index: true
  },

  // Event type
  eventType: {
    type: String,
    enum: [
      // App usage
      'app_opened',
      'settings_opened',
      
      // Notification actions
      'push_enabled',
      'push_disabled',
      'slack_enabled',
      'slack_disabled',
      
      // Configuration
      'business_hours_configured',
      'keywords_added',
      
      // Testing
      'test_notification_sent',
      
      // Tab navigation
      'tab_switched',
      
      // Support
      'support_ticket_submitted'
    ],
    required: true,
    index: true
  },

  // Minimal metadata
  metadata: {
    tabName: String,
    channel: String,        // push, slack, email
    keywordCount: Number,
    device: String          // Chrome on Windows
  },

  sessionId: String,

  // Auto-expire after 90 days
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7776000 // 90 days TTL
  }
});

// Indexes
analyticsSchema.index({ locationId: 1, eventType: 1, createdAt: -1 });
analyticsSchema.index({ createdAt: 1 }); // TTL

// Track event (fire-and-forget)
analyticsSchema.statics.track = async function(locationId, userId, eventType, metadata = {}) {
  try {
    await this.create({
      locationId,
      userId,
      eventType,
      metadata,
      sessionId: metadata.sessionId || null
    });
  } catch (error) {
    console.error('Analytics tracking failed:', error.message);
  }
};

// Get usage stats
analyticsSchema.statics.getStats = async function(locationId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const [totalUsers, featureUsage] = await Promise.all([
    this.distinct('userId', { locationId }),
    this.aggregate([
      { $match: { locationId, createdAt: { $gte: startDate } } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  return {
    totalUniqueUsers: totalUsers.length,
    featureUsage,
    period: `Last ${days} days`
  };
};

module.exports = mongoose.model('Analytics', analyticsSchema);

