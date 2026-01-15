const mongoose = require('mongoose');

/**
 * Push Subscription Model
 * Stores browser push notification subscriptions
 */
const pushSubscriptionSchema = new mongoose.Schema({
  locationId: {
    type: String,
    required: true,
    index: true
  },
  
  userId: {
    type: String,
    required: true, // Must have valid userId - no 'default' fallback
    index: true
  },
  
  // Device fingerprint (browser + OS combo)
  deviceInfo: {
    browser: String,
    os: String,
    deviceId: String // Unique ID for this browser/device combo
  },
  
  // Web Push subscription object
  subscription: {
    endpoint: {
      type: String,
      required: true,
      unique: true
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    }
  },
  
  // Metadata
  userAgent: String,
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Expiry tracking
  isExpired: {
    type: Boolean,
    default: false
  },
  
  expiredAt: {
    type: Date,
    default: null
  },
  
  expiredReason: {
    type: String,
    default: null
  },
  
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
pushSubscriptionSchema.index({ locationId: 1, isActive: 1 });
pushSubscriptionSchema.index({ userId: 1, isActive: 1 });
// Note: subscription.endpoint already has unique: true in schema (line 24)

// Compound index to track subscriptions per user
pushSubscriptionSchema.index({ locationId: 1, userId: 1, isActive: 1 });

// Static methods
pushSubscriptionSchema.statics.findActiveByLocation = async function(locationId) {
  return await this.find({ locationId, isActive: true });
};

pushSubscriptionSchema.statics.findActiveByUser = async function(locationId, userId) {
  return await this.findOne({ locationId, userId, isActive: true });
};

pushSubscriptionSchema.statics.deactivateByEndpoint = async function(endpoint) {
  return await this.findOneAndUpdate(
    { 'subscription.endpoint': endpoint },
    { isActive: false },
    { new: true }
  );
};

pushSubscriptionSchema.statics.markAsExpired = async function(endpoint, reason = 'subscription_expired') {
  return await this.findOneAndUpdate(
    { 'subscription.endpoint': endpoint },
    { 
      isActive: false,
      isExpired: true,
      expiredAt: new Date(),
      expiredReason: reason
    },
    { new: true }
  );
};

pushSubscriptionSchema.statics.hasExpiredSubscription = async function(locationId) {
  const expired = await this.findOne({ 
    locationId, 
    isExpired: true 
  });
  return !!expired;
};

// Instance methods
pushSubscriptionSchema.methods.updateLastUsed = async function() {
  this.lastUsedAt = new Date();
  return await this.save();
};

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);

