const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Slack Notification Service
 * Sends notifications to Slack via webhooks
 */
class SlackService {
  /**
   * Send notification to Slack webhook
   */
  async send(webhookUrl, payload) {
    try {
      const slackMessage = {
        text: `🔔 ${payload.title || 'New Message'}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🔔 ${payload.title || 'New Message'}`,
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*From:*\n${payload.contactName || 'Unknown Contact'}`
              },
              {
                type: 'mrkdwn',
                text: `*Time:*\n${new Date().toLocaleString()}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Message:*\n${payload.body || ''}`
            }
          }
        ]
      };

      // Add action button if URL provided
      if (payload.url) {
        slackMessage.blocks.push({
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View in GHL →',
                emoji: true
              },
              url: payload.url,
              style: 'primary'
            }
          ]
        });
      }

      const response = await axios.post(webhookUrl, slackMessage, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });

      logger.info('Slack notification sent successfully');
      
      return { success: true, response: response.data };
    } catch (error) {
      logger.error('Error sending Slack notification:', error.message);
      
      // Check if webhook URL is invalid
      if (error.response?.status === 404) {
        throw new Error('Invalid Slack webhook URL');
      }
      
      throw error;
    }
  }

  /**
   * Send test notification
   */
  async sendTest(webhookUrl) {
    return await this.send(webhookUrl, {
      title: 'NotifyPro Test',
      contactName: 'Test Contact',
      body: 'This is a test notification from NotifyPro. If you see this, Slack notifications are working! 🎉',
      url: 'https://app.gohighlevel.com'
    });
  }

  /**
   * Validate webhook URL
   */
  async validate(webhookUrl) {
    try {
      // Send a minimal test message
      await axios.post(webhookUrl, {
        text: 'NotifyPro webhook validation'
      }, {
        timeout: 3000
      });
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = new SlackService();

