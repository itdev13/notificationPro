import React from 'react';
import { Card, Button } from 'antd';
import { MailOutlined, QuestionCircleOutlined, BookOutlined } from '@ant-design/icons';

export default function SupportTab() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        🆘 Support & Help
      </h2>

      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Documentation */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
            <div style={{ 
              fontSize: '32px', 
              background: '#e6f7ff', 
              padding: '16px', 
              borderRadius: '12px',
              lineHeight: 1
            }}>
              📖
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                Documentation
              </h3>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                Learn how to set up and use NotifyPro. Get started with browser push notifications, 
                configure filters, and integrate with Email and Slack.
              </p>
              <Button 
                type="primary"
                icon={<BookOutlined />}
                onClick={() => window.open('/about.html', '_blank')}
              >
                View Documentation
              </Button>
            </div>
          </div>
        </Card>

        {/* Contact Support */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
            <div style={{ 
              fontSize: '32px', 
              background: '#fff7e6', 
              padding: '16px', 
              borderRadius: '12px',
              lineHeight: 1
            }}>
              💬
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                Contact Support
              </h3>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                Need help? Have questions? Our support team is here to assist you.
              </p>
              <Button 
                icon={<MailOutlined />}
                onClick={() => window.location.href = 'mailto:support@notifypro.com?subject=NotifyPro Support Request'}
              >
                Email Support
              </Button>
            </div>
          </div>
        </Card>

        {/* FAQs */}
        <Card title={<><QuestionCircleOutlined /> Frequently Asked Questions</>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>
                Q: Why am I not receiving notifications?
              </h4>
              <p style={{ color: '#666', fontSize: '14px' }}>
                A: Make sure you've enabled browser push notifications in the Settings tab and 
                clicked "Allow" when your browser prompts you. Also check that your browser/OS 
                notification settings allow notifications from this site.
              </p>
            </div>

            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>
                Q: How do business hours work?
              </h4>
              <p style={{ color: '#666', fontSize: '14px' }}>
                A: When enabled, notifications will only be sent during your specified business 
                hours and days. Messages outside these hours won't trigger notifications (but 
                they're still in your GHL inbox).
              </p>
            </div>

            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>
                Q: What are priority keywords?
              </h4>
              <p style={{ color: '#666', fontSize: '14px' }}>
                A: Priority keywords ensure you always get notified for important messages. 
                If a message contains any of your keywords (like "urgent", "asap"), it will 
                bypass business hours filters.
              </p>
            </div>

            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>
                Q: Can I use Email/Slack instead of browser push?
              </h4>
              <p style={{ color: '#666', fontSize: '14px' }}>
                A: Yes! Enable Email or Slack notifications in the Settings tab. These work 
                in all environments, including when your app is loaded in an iframe.
              </p>
            </div>

            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>
                Q: Do notifications work when I close my browser?
              </h4>
              <p style={{ color: '#666', fontSize: '14px' }}>
                A: Browser push notifications work even when the browser is minimized, but 
                not when it's completely closed (this is a browser limitation). For 24/7 
                notifications, use Email or Slack.
              </p>
            </div>
          </div>
        </Card>

        {/* System Info */}
        <Card title="System Information">
          <div style={{ fontSize: '14px', color: '#666' }}>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Location ID:</strong> {context?.locationId || 'Not available'}</p>
            <p><strong>Support:</strong> support@notifypro.com</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

