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

    // Check if message contains priority keywords FIRST
    const messageText = message.text || message.body || '';
    const isPriority = this.checkPriorityKeywords(
      messageText,
      preferences.filters.priorityKeywords
    );

    // If priority keyword found, ALWAYS notify (bypass business hours)
    if (isPriority) {
      logger.info('Priority keyword detected - bypassing business hours filter');
      return {
        notify: true,
        isPriority: true,
        reason: 'priority_keyword'
      };
    }

    // Check business hours (only if not priority)
    if (preferences.filters.businessHoursOnly) {
      if (!this.isBusinessHours(preferences.filters.businessHours)) {
        logger.info('Notification filtered: outside business hours');
        return {
          notify: false,
          isPriority: false,
          reason: 'business_hours'
        };
      }
    }

    // All checks passed
    return {
      notify: true,
      isPriority: false,
      reason: 'business_hours_ok'
    };
  }

  /**
   * Check if current time is within business hours
   * Uses moment-timezone for accurate timezone handling including DST
   */
  isBusinessHours(businessHours) {
    try {
      // Get current time in the specified timezone
      const now = moment().tz(businessHours.timezone);
      const currentDay = now.format('dddd').toLowerCase();
      const currentTime = now.format('HH:mm');

      // Log for debugging
      logger.debug(`Business hours check:`, {
        timezone: businessHours.timezone,
        currentTime: now.format('YYYY-MM-DD HH:mm:ss Z'),
        day: currentDay,
        businessDays: businessHours.days,
        businessHours: `${businessHours.start} - ${businessHours.end}`
      });

      // Check if today is a business day
      if (!businessHours.days || !businessHours.days.includes(currentDay)) {
        logger.info(`Not a business day: ${currentDay}`);
        return false;
      }

      // Parse times for accurate comparison
      const start = businessHours.start; // "09:00"
      const end = businessHours.end;     // "17:00"

      // Handle edge case: business hours crossing midnight (e.g., 22:00 - 02:00)
      if (end < start) {
        // Split into two ranges: start-23:59 and 00:00-end
        const isAfterStart = currentTime >= start;
        const isBeforeEnd = currentTime <= end;
        return isAfterStart || isBeforeEnd;
      }

      // Normal case: business hours within same day
      const isWithinHours = currentTime >= start && currentTime <= end;
      
      if (!isWithinHours) {
        logger.info(`Outside business hours: ${currentTime} (hours: ${start}-${end})`);
      }

      return isWithinHours;

    } catch (error) {
      logger.error('Error checking business hours:', error);
      // Default to allowing notification on error (safer than blocking)
      return true;
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

