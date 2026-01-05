const mongoose = require('mongoose');

/**
 * Notification Preferences Model
 * Stores user preferences for how and when they want to be notified
 */
const notificationPreferenceSchema = new mongoose.Schema({
  locationId: {
    type: String,
    required: true,
    index: true
  },
  
  userId: {
    type: String,
    default: null // null = location-wide settings
  },
  
  // Notification channels
  channels: {
    push: {
      enabled: { type: Boolean, default: true },
      sound: { type: Boolean, default: true }
    },
    email: {
      enabled: { type: Boolean, default: false },
      address: { type: String, default: null }
    },
    slack: {
      enabled: { type: Boolean, default: false },
      webhookUrl: { type: String, default: null }
    }
  },
  
  // Filters and rules
  filters: {
    businessHoursOnly: { type: Boolean, default: false },
    businessHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      timezone: { type: String, default: 'America/New_York' },
      days: {
        type: [String],
        default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }
    },
    priorityKeywords: {
      type: [String],
      default: [],
      validate: {
        validator: function(keywords) {
          return keywords.length <= 50; // Max 50 keywords
        },
        message: 'Maximum 50 priority keywords allowed'
      }
    }
  },
  
  // Feature toggles
  features: {
    testMode: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Compound unique index
notificationPreferenceSchema.index({ locationId: 1, userId: 1 }, { unique: true });

// Static methods
notificationPreferenceSchema.statics.findByLocation = async function(locationId, userId = null) {
  return await this.findOne({ locationId, userId });
};

notificationPreferenceSchema.statics.getOrCreate = async function(locationId, userId = null) {
  let pref = await this.findOne({ locationId, userId });
  
  if (!pref) {
    pref = await this.create({ locationId, userId });
  }
  
  return pref;
};

// Instance methods
notificationPreferenceSchema.methods.hasEnabledChannels = function() {
  return this.channels.push.enabled || 
         this.channels.email.enabled || 
         this.channels.slack.enabled;
};

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);

