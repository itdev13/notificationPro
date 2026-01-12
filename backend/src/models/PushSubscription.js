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
    default: null
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
  
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
pushSubscriptionSchema.index({ locationId: 1, isActive: 1 });
// Note: subscription.endpoint already has unique: true in schema (line 24)

// Static methods
pushSubscriptionSchema.statics.findActiveByLocation = async function(locationId) {
  return await this.find({ locationId, isActive: true });
};

pushSubscriptionSchema.statics.deactivateByEndpoint = async function(endpoint) {
  return await this.findOneAndUpdate(
    { 'subscription.endpoint': endpoint },
    { isActive: false },
    { new: true }
  );
};

// Instance methods
pushSubscriptionSchema.methods.updateLastUsed = async function() {
  this.lastUsedAt = new Date();
  return await this.save();
};

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);

