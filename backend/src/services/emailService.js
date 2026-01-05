const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const logger = require('../utils/logger');

/**
 * Email Notification Service
 * Sends email notifications using AWS SES
 */
class EmailService {
  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    this.fromEmail = process.env.SES_FROM_EMAIL;
    this.fromName = process.env.SES_FROM_NAME || 'NotifyPro';
  }

  /**
   * Send email notification
   */
  async send(toEmail, payload) {
    try {
      const params = {
        Source: `${this.fromName} <${this.fromEmail}>`,
        Destination: {
          ToAddresses: [toEmail]
        },
        Message: {
          Subject: {
            Data: payload.subject || 'New Message in GoHighLevel',
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: this.buildEmailTemplate(payload),
              Charset: 'UTF-8'
            },
            Text: {
              Data: payload.textBody || payload.body || '',
              Charset: 'UTF-8'
            }
          }
        }
      };

      const command = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);
      
      logger.info(`Email sent successfully to ${toEmail}. MessageId: ${response.MessageId}`);
      
      return { success: true, messageId: response.MessageId };
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Build HTML email template
   */
  buildEmailTemplate(payload) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px;
          }
          .message-box {
            background: #f9fafb;
            border-left: 4px solid #667eea;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .message-box p {
            margin: 0;
            color: #4b5563;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
            font-weight: 600;
          }
          .footer {
            padding: 20px 30px;
            background: #f9fafb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 ${payload.title || 'New Message'}</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have a new message in GoHighLevel:</p>
            
            <div class="message-box">
              <p><strong>From:</strong> ${payload.contactName || 'Unknown Contact'}</p>
              <p><strong>Message:</strong> ${payload.body || ''}</p>
            </div>
            
            ${payload.url ? `
              <a href="${payload.url}" class="button">
                View Conversation →
              </a>
            ` : ''}
          </div>
          <div class="footer">
            <p>This is an automated notification from NotifyPro</p>
            <p>To manage your notification preferences, visit your GHL dashboard</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send test email
   */
  async sendTest(toEmail) {
    return await this.send(toEmail, {
      subject: '🔔 NotifyPro Test Email',
      title: 'Test Notification',
      contactName: 'Test Contact',
      body: 'This is a test email notification. If you receive this, email notifications are working correctly!',
      url: 'https://app.gohighlevel.com'
    });
  }
}

module.exports = new EmailService();

