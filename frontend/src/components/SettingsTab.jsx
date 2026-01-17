import React, { useState, useEffect } from 'react';
import { useGHLContext } from '../hooks/useGHLContext';
import { Card, Tag, Alert, Button, Spin } from 'antd';
import { BellOutlined, MailOutlined, SlackOutlined, ClockCircleOutlined, RocketOutlined, WarningOutlined } from '@ant-design/icons';
import axios from 'axios';
import { getSettingsUrl, getGenerateTokenUrl, getSubscriptionStatusUrl } from '../constants/api';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { getDeviceInfo, getDeviceDisplayName } from '../utils/deviceInfo';

export default function SettingsTab() {
  const { context } = useGHLContext();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    if (context?.locationId) {
      loadPreferences();
      checkSubscriptionStatus();
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

  const checkSubscriptionStatus = async () => {
    try {
      if (!context.userId) {
        console.warn('⚠️ Cannot check subscription status - userId missing');
        return;
      }

      const deviceInfo = getDeviceInfo();
      const response = await axios.get(getSubscriptionStatusUrl(), {
        params: { 
          locationId: context.locationId,
          userId: context.userId, // REQUIRED
          deviceId: deviceInfo.deviceId
        }
      });
      setSubscriptionStatus(response.data);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleOpenSettings = async () => {
    try {
      console.log('Opening settings with context:', {
        locationId: context.locationId,
        userId: context.userId,
        hasUserId: !!context.userId
      });

      if (!context.userId) {
        message.error('User ID is required. Please refresh the page and try again.');
        return;
      }

      // Generate token and open settings
      const response = await axios.post(getGenerateTokenUrl(), {
        locationId: context.locationId,
        userId: context.userId, // REQUIRED
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

  // Check if any notifications are enabled
  const hasNotificationsEnabled = preferences.channels.push.enabled || 
                                   preferences.channels.slack.enabled;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Different Device Warning */}
      {subscriptionStatus?.isActiveOnDifferentDevice && (
        <Alert
          type="warning"
          icon={<WarningOutlined />}
          message="📱 Push Notifications Active on Different Device"
          description={
            <div>
              <p style={{ marginBottom: '12px' }}>
                Push notifications are currently enabled on <strong>{subscriptionStatus.activeDevice?.browser} on {subscriptionStatus.activeDevice?.os}</strong>, 
                not on <strong>{getDeviceDisplayName()}</strong>.
              </p>
              <p style={{ marginBottom: '16px', fontWeight: '500', color: '#d46b08' }}>
                ⚠️ Note: Only ONE device can receive notifications at a time. 
                Enabling here will switch notifications to this device.
              </p>
              <Button 
                type="primary"
                icon={<RocketOutlined />}
                onClick={handleOpenSettings}
              >
                Switch to This Device
              </Button>
            </div>
          }
          style={{ marginBottom: '24px' }}
          closable
        />
      )}

      {/* Expired Subscription Warning */}
      {subscriptionStatus?.hasExpiredSubscription && preferences?.channels?.push?.enabled && (
        <Alert
          type="warning"
          icon={<WarningOutlined />}
          message="⚠️ Push Notifications Expired"
          description={
            <div>
              <p style={{ marginBottom: '12px' }}>
                Your browser push subscription has expired. This can happen when you clear browser data, 
                uninstall the browser, or after long periods of inactivity.
              </p>
              <p style={{ marginBottom: '16px', fontWeight: '500' }}>
                To continue receiving push notifications:
              </p>
              <Button 
                type="primary"
                icon={<RocketOutlined />}
                onClick={handleOpenSettings}
              >
                Reconnect Push Notifications
              </Button>
            </div>
          }
          style={{ marginBottom: '24px' }}
          closable
        />
      )}

      {/* Quick Setup Banner (if no notifications enabled) */}
      {!hasNotificationsEnabled && (
        <Card style={{ 
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none'
        }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '12px', color: 'white' }}>
              Enable Push Notifications
            </h2>
            <p style={{ fontSize: '16px', marginBottom: '24px', opacity: 0.95 }}>
              Get instant browser notifications when new messages arrive in GoHighLevel
            </p>
            <Button 
              type="default"
              size="large"
              icon={<RocketOutlined />}
              onClick={handleOpenSettings}
              style={{
                height: '48px',
                fontSize: '16px',
                fontWeight: '600',
                background: 'white',
                borderColor: 'white'
              }}
            >
              Setup Notifications Now
            </Button>
          </div>
        </Card>
      )}

      {/* Header with Edit Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
          {hasNotificationsEnabled ? '⚙️ Your Notification Settings' : '⚙️ Notification Settings'}
        </h2>
        <Button 
          type="primary" 
          icon={<RocketOutlined />}
          size="large"
          onClick={handleOpenSettings}
        >
          {hasNotificationsEnabled ? 'Edit Settings' : 'Configure Now'}
        </Button>
      </div>

      {/* Notification Channels */}
      <Card 
        title={<><BellOutlined /> Notification Channels</>} 
        style={{ marginBottom: '20px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           {/* Push */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <strong>🔔 Browser Push Notifications</strong>
              <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0' }}>
                {subscriptionStatus?.isActiveOnThisDevice 
                  ? `Active on this device (${getDeviceDisplayName()})`
                  : subscriptionStatus?.isActiveOnDifferentDevice
                  ? `Active on ${subscriptionStatus.activeDevice?.browser} on ${subscriptionStatus.activeDevice?.os}`
                  : 'Instant notifications in your browser'
                }
              </p>
            </div>
            <Tag color={preferences.channels.push.enabled ? 'success' : 'default'}>
              {preferences.channels.push.enabled ? 'Enabled' : 'Disabled'}
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
              padding: '16px', 
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '8px', 
              fontSize: '14px', 
              color: '#0369a1',
              border: '1px solid #bae6fd'
            }}>
              <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>⏰</span>
                <strong>Hours:</strong> 
                <span style={{ fontSize: '16px', fontWeight: '600' }}>
                  {preferences.filters.businessHours.start} → {preferences.filters.businessHours.end}
                </span>
              </p>
              <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🌍</span>
                <strong>Timezone:</strong> {preferences.filters.businessHours.timezone}
              </p>
              <p style={{ margin: '8px 0', display: 'flex', alignItems: 'start', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📅</span>
                <span>
                  <strong>Days:</strong><br/>
                  {(preferences.filters.businessHours.days || []).map(day => 
                    day.charAt(0).toUpperCase() + day.slice(1)
                  ).join(', ')}
                </span>
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
            onClick={() => window.location.href = 'mailto:support@vaultsuite.store'}
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

