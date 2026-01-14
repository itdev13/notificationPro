import React, { useState, useEffect } from 'react';
import { useGHLContext } from '../hooks/useGHLContext';
import { Card, Tag, Alert, Button, Spin } from 'antd';
import { BellOutlined, MailOutlined, SlackOutlined, ClockCircleOutlined, RocketOutlined } from '@ant-design/icons';
import axios from 'axios';
import { getSettingsUrl, getGenerateTokenUrl } from '../constants/api';
import { QuestionCircleOutlined } from '@ant-design/icons';

export default function SettingsTab() {
  const { context } = useGHLContext();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    if (context?.locationId) {
      loadPreferences();
    }
  }, [context]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await axios.get(getSettingsUrl(), {
        params: { locationId: context.locationId }
      });
      setPreferences(response.data.preferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettings = async () => {
    try {
      // Generate token and open settings
      const response = await axios.post(getGenerateTokenUrl(), {
        locationId: context.locationId,
        userId: context.userId,
        companyId: context.companyId,
        email: context.email,
        userName: context.userName,
        type: context.type
      });

      const { token } = response.data;
      const settingsUrl = `${window.location.origin}/settings?token=${token}`;
      window.open(settingsUrl, 'NotifyProSettings', 'width=1200,height=900');
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <Spin size="large" />
        <p style={{ marginTop: '16px', color: '#666' }}>Loading settings...</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <Alert 
        type="error" 
        message="Failed to load settings" 
        description="Please try refreshing the page."
      />
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header with Edit Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
          ⚙️ Current Settings
        </h2>
        <Button 
          type="primary" 
          icon={<RocketOutlined />}
          size="large"
          onClick={handleOpenSettings}
        >
          Edit Settings
        </Button>
      </div>

      <Alert
        type="info"
        message="Read-Only Preview"
        description="This shows your current notification settings. Click 'Edit Settings' to modify them in a new window."
        style={{ marginBottom: '20px' }}
        showIcon
      />

      {/* Notification Channels */}
      <Card 
        title={<><BellOutlined /> Notification Channels</>} 
        style={{ marginBottom: '20px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Push */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>🔔 Browser Push Notifications</strong>
              <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0' }}>
                Instant notifications in your browser
              </p>
            </div>
            <Tag color={preferences.channels.push.enabled ? 'success' : 'default'}>
              {preferences.channels.push.enabled ? 'Enabled' : 'Disabled'}
            </Tag>
          </div>

          {/* Email */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>📧 Email Notifications</strong>
              <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0' }}>
                {preferences.channels.email.address || 'Not configured'}
              </p>
            </div>
            <Tag color={preferences.channels.email.enabled ? 'success' : 'default'}>
              {preferences.channels.email.enabled ? 'Enabled' : 'Disabled'}
            </Tag>
          </div>

          {/* Slack */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>💬 Slack Notifications</strong>
              <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0' }}>
                {preferences.channels.slack.webhookUrl ? 'Webhook configured' : 'Not configured'}
              </p>
            </div>
            <Tag color={preferences.channels.slack.enabled ? 'success' : 'default'}>
              {preferences.channels.slack.enabled ? 'Enabled' : 'Disabled'}
            </Tag>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card 
        title={<><ClockCircleOutlined /> Filters & Rules</>} 
        style={{ marginBottom: '20px' }}
      >
        {/* Business Hours */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong>⏰ Business Hours Only</strong>
            <Tag color={preferences.filters.businessHoursOnly ? 'success' : 'default'}>
              {preferences.filters.businessHoursOnly ? 'Enabled' : 'Disabled'}
            </Tag>
          </div>
          {preferences.filters.businessHoursOnly && (
            <div style={{ 
              padding: '12px', 
              background: '#f9f9f9', 
              borderRadius: '6px', 
              fontSize: '14px', 
              color: '#666' 
            }}>
              <p style={{ margin: '4px 0' }}>
                <strong>Hours:</strong> {preferences.filters.businessHours.start} - {preferences.filters.businessHours.end}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>Timezone:</strong> {preferences.filters.businessHours.timezone}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>Days:</strong> {(preferences.filters.businessHours.days || []).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Priority Keywords */}
        <div>
          <strong style={{ display: 'block', marginBottom: '8px' }}>🎯 Priority Keywords</strong>
          {preferences.filters.priorityKeywords && preferences.filters.priorityKeywords.length > 0 ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {preferences.filters.priorityKeywords.map(keyword => (
                <Tag key={keyword} color="orange">{keyword}</Tag>
              ))}
            </div>
          ) : (
            <p style={{ color: '#999', fontSize: '14px' }}>No priority keywords set</p>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button 
            type="primary"
            icon={<RocketOutlined />}
            onClick={handleOpenSettings}
          >
            Edit All Settings
          </Button>
          <Button 
            icon={<MailOutlined />}
            onClick={() => window.location.href = 'mailto:support@notifypro.com'}
          >
            Contact Support
          </Button>
          <Button 
            icon={<QuestionCircleOutlined />}
            onClick={() => window.open('/about.html', '_blank')}
          >
            View Help
          </Button>
        </div>
      </Card>
    </div>
  );
}

