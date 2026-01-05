const moment = require('moment-timezone');
const logger = require('../utils/logger');

/**
 * Filter Service
 * Determines whether a notification should be sent based on user preferences
 */
class FilterService {
  /**
   * Determine if notification should be sent
   */
  shouldNotify(preferences, message) {
    // No preferences = no notification
    if (!preferences) {
      return {
        notify: false,
        reason: 'no_preference'
      };
    }

    // No enabled channels = no notification
    if (!preferences.hasEnabledChannels()) {
      return {
        notify: false,
        reason: 'no_channels'
      };
    }

    // Test mode = don't send real notifications
    if (preferences.features?.testMode) {
      return {
        notify: false,
        reason: 'test_mode'
      };
    }

    // Check business hours
    if (preferences.filters.businessHoursOnly) {
      if (!this.isBusinessHours(preferences.filters.businessHours)) {
        logger.info('Notification filtered: outside business hours');
        return {
          notify: false,
          reason: 'business_hours'
        };
      }
    }

    // Check if message contains priority keywords
    const isPriority = this.checkPriorityKeywords(
      message.text || message.body || '',
      preferences.filters.priorityKeywords
    );

    return {
      notify: true,
      isPriority
    };
  }

  /**
   * Check if current time is within business hours
   */
  isBusinessHours(businessHours) {
    try {
      const now = moment().tz(businessHours.timezone);
      const currentDay = now.format('dddd').toLowerCase();
      const currentTime = now.format('HH:mm');

      // Check if today is a business day
      if (!businessHours.days.includes(currentDay)) {
        return false;
      }

      // Check if current time is within business hours
      const start = businessHours.start;
      const end = businessHours.end;

      return currentTime >= start && currentTime <= end;
    } catch (error) {
      logger.error('Error checking business hours:', error);
      return true; // Default to allowing notification on error
    }
  }

  /**
   * Check if message contains priority keywords
   */
  checkPriorityKeywords(messageText, keywords) {
    if (!keywords || keywords.length === 0) {
      return false;
    }

    const lowerMessage = messageText.toLowerCase();
    
    return keywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
  }

  /**
   * Extract contact name from GHL webhook data
   */
  getContactName(webhookData) {
    return webhookData.contactName || 
           webhookData.contact?.name || 
           webhookData.contact?.firstName && webhookData.contact?.lastName 
             ? `${webhookData.contact.firstName} ${webhookData.contact.lastName}`.trim()
             : 'Unknown Contact';
  }

  /**
   * Build conversation URL for GHL
   */
  buildConversationUrl(locationId, conversationId) {
    return `https://app.gohighlevel.com/v2/location/${locationId}/conversations/${conversationId}`;
  }
}

module.exports = new FilterService();

