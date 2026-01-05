import React, { useState, useEffect } from 'react';
import { useGHLContext } from './hooks/useGHLContext';
import { Card, Switch, Input, TimePicker, Select, Tag, Button, message, Divider, Alert } from 'antd';
import { BellOutlined, MailOutlined, SlackOutlined, ClockCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

function App() {
  const { context, loading: contextLoading } = useGHLContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');

  // API base URL
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  // Load preferences on mount
  useEffect(() => {
    if (context?.locationId) {
      loadPreferences();
      checkPushSupport();
    }
  }, [context]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/settings`, {
        params: { locationId: context.locationId }
      });
      setPreferences(response.data.preferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
      message.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const checkPushSupport = () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setPushSupported(supported);
    setPushPermission(Notification.permission || 'default');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.post(`${API_URL}/api/settings`, {
        locationId: context.locationId,
        channels: preferences.channels,
        filters: preferences.filters
      });
      message.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const requestPushPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission === 'granted') {
        // Register service worker and subscribe
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        const vapidResponse = await axios.get(`${API_URL}/api/subscriptions/vapid-public-key`);
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidResponse.data.publicKey
        });

        // Save subscription to backend
        await axios.post(`${API_URL}/api/subscriptions/subscribe`, {
          locationId: context.locationId,
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent
        });

        message.success('Push notifications enabled!');
        
        // Update preferences to enable push
        setPreferences(prev => ({
          ...prev,
          channels: {
            ...prev.channels,
            push: { ...prev.channels.push, enabled: true }
          }
        }));
      }
    } catch (error) {
      console.error('Error enabling push:', error);
      message.error('Failed to enable push notifications');
    }
  };

  const sendTestNotification = async (channel) => {
    try {
      await axios.post(`${API_URL}/api/subscriptions/test`, {
        locationId: context.locationId,
        channel
      });
      message.success(`Test ${channel} notification sent!`);
    } catch (error) {
      message.error(error.response?.data?.error || 'Test failed');
    }
  };

  if (contextLoading || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Loading NotifyPro...</h2>
      </div>
    );
  }

  if (!preferences) {
    return <div>Error loading preferences</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          🔔 NotifyPro Settings
        </h1>
        <p style={{ color: '#666' }}>
          Configure how and when you receive notifications for new messages
        </p>
      </div>

      {/* Notification Channels */}
      <Card title={<><BellOutlined /> Notification Channels</>} style={{ marginBottom: '20px' }}>
        {/* Browser Push */}
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>🔔 Browser Push Notifications</h3>
              <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                Get instant notifications in your browser
              </p>
            </div>
            <Switch
              checked={preferences.channels.push.enabled}
              onChange={(checked) => {
                if (checked && pushPermission !== 'granted') {
                  requestPushPermission();
                } else {
                  setPreferences(prev => ({
                    ...prev,
                    channels: {
                      ...prev.channels,
                      push: { ...prev.channels.push, enabled: checked }
                    }
                  }));
                }
              }}
              disabled={!pushSupported}
            />
          </div>
          {!pushSupported && (
            <Alert type="warning" message="Browser push notifications not supported" style={{ marginTop: '10px' }} />
          )}
          {pushSupported && pushPermission === 'denied' && (
            <Alert type="error" message="Push notifications blocked. Please enable in browser settings." style={{ marginTop: '10px' }} />
          )}
          {preferences.channels.push.enabled && (
            <Button size="small" style={{ marginTop: '10px' }} onClick={() => sendTestNotification('push')}>
              Send Test Notification
            </Button>
          )}
        </div>

        {/* Email */}
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <h3 style={{ margin: 0 }}>📧 Email Notifications</h3>
              <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={preferences.channels.email.enabled}
              onChange={(checked) => {
                setPreferences(prev => ({
                  ...prev,
                  channels: {
                    ...prev.channels,
                    email: { ...prev.channels.email, enabled: checked }
                  }
                }));
              }}
            />
          </div>
          {preferences.channels.email.enabled && (
            <div>
              <Input
                type="email"
                placeholder="your@email.com"
                value={preferences.channels.email.address || ''}
                onChange={(e) => {
                  setPreferences(prev => ({
                    ...prev,
                    channels: {
                      ...prev.channels,
                      email: { ...prev.channels.email, address: e.target.value }
                    }
                  }));
                }}
                style={{ marginTop: '10px' }}
              />
              <Button size="small" style={{ marginTop: '10px' }} onClick={() => sendTestNotification('email')}>
                Send Test Email
              </Button>
            </div>
          )}
        </div>

        {/* Slack */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <h3 style={{ margin: 0 }}>💬 Slack Notifications</h3>
              <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                Send notifications to Slack channel
              </p>
            </div>
            <Switch
              checked={preferences.channels.slack.enabled}
              onChange={(checked) => {
                setPreferences(prev => ({
                  ...prev,
                  channels: {
                    ...prev.channels,
                    slack: { ...prev.channels.slack, enabled: checked }
                  }
                }));
              }}
            />
          </div>
          {preferences.channels.slack.enabled && (
            <div>
              <Input
                placeholder="https://hooks.slack.com/services/..."
                value={preferences.channels.slack.webhookUrl || ''}
                onChange={(e) => {
                  setPreferences(prev => ({
                    ...prev,
                    channels: {
                      ...prev.channels,
                      slack: { ...prev.channels.slack, webhookUrl: e.target.value }
                    }
                  }));
                }}
                style={{ marginTop: '10px' }}
              />
              <Button size="small" style={{ marginTop: '10px' }} onClick={() => sendTestNotification('slack')}>
                Send Test to Slack
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Filters */}
      <Card title={<><ClockCircleOutlined /> Filters & Rules</>} style={{ marginBottom: '20px' }}>
        {/* Business Hours */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <h3 style={{ margin: 0 }}>⏰ Business Hours Only</h3>
              <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                Only send notifications during business hours
              </p>
            </div>
            <Switch
              checked={preferences.filters.businessHoursOnly}
              onChange={(checked) => {
                setPreferences(prev => ({
                  ...prev,
                  filters: {
                    ...prev.filters,
                    businessHoursOnly: checked
                  }
                }));
              }}
            />
          </div>
          
          {preferences.filters.businessHoursOnly && (
            <div style={{ marginTop: '15px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Business Hours:</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Input
                    type="time"
                    value={preferences.filters.businessHours.start}
                    onChange={(e) => {
                      setPreferences(prev => ({
                        ...prev,
                        filters: {
                          ...prev.filters,
                          businessHours: {
                            ...prev.filters.businessHours,
                            start: e.target.value
                          }
                        }
                      }));
                    }}
                  />
                  <span style={{ alignSelf: 'center' }}>to</span>
                  <Input
                    type="time"
                    value={preferences.filters.businessHours.end}
                    onChange={(e) => {
                      setPreferences(prev => ({
                        ...prev,
                        filters: {
                          ...prev.filters,
                          businessHours: {
                            ...prev.filters.businessHours,
                            end: e.target.value
                          }
                        }
                      }));
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Timezone:</label>
                <Select
                  style={{ width: '100%' }}
                  value={preferences.filters.businessHours.timezone}
                  onChange={(value) => {
                    setPreferences(prev => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        businessHours: {
                          ...prev.filters.businessHours,
                          timezone: value
                        }
                      }
                    }));
                  }}
                >
                  <Option value="America/New_York">Eastern Time (ET)</Option>
                  <Option value="America/Chicago">Central Time (CT)</Option>
                  <Option value="America/Denver">Mountain Time (MT)</Option>
                  <Option value="America/Los_Angeles">Pacific Time (PT)</Option>
                  <Option value="Europe/London">London (GMT)</Option>
                  <Option value="Asia/Dubai">Dubai (GST)</Option>
                </Select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Business Days:</label>
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  value={preferences.filters.businessHours.days}
                  onChange={(values) => {
                    setPreferences(prev => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        businessHours: {
                          ...prev.filters.businessHours,
                          days: values
                        }
                      }
                    }));
                  }}
                >
                  <Option value="monday">Monday</Option>
                  <Option value="tuesday">Tuesday</Option>
                  <Option value="wednesday">Wednesday</Option>
                  <Option value="thursday">Thursday</Option>
                  <Option value="friday">Friday</Option>
                  <Option value="saturday">Saturday</Option>
                  <Option value="sunday">Sunday</Option>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Priority Keywords */}
        <div>
          <h3 style={{ margin: '0 0 10px 0' }}>🎯 Priority Keywords</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
            Always notify when messages contain these keywords (case-insensitive)
          </p>
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="Add keywords like: urgent, asap, emergency"
            value={preferences.filters.priorityKeywords}
            onChange={(values) => {
              setPreferences(prev => ({
                ...prev,
                filters: {
                  ...prev.filters,
                  priorityKeywords: values
                }
              }));
            }}
          />
          <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
            Press Enter to add a keyword
          </p>
        </div>
      </Card>

      {/* Save Button */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <Button
          type="primary"
          size="large"
          loading={saving}
          onClick={handleSave}
          style={{ minWidth: '200px' }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Info Box */}
      <Alert
        type="info"
        message="How NotifyPro Works"
        description={
          <div>
            <p>• When a contact sends you a message in GHL, NotifyPro instantly notifies you</p>
            <p>• Notifications are sent to all enabled channels (browser, email, slack)</p>
            <p>• Business hours filter prevents notifications outside working hours</p>
            <p>• Priority keywords ensure important messages always get through</p>
          </div>
        }
        style={{ marginTop: '20px' }}
      />
    </div>
  );
}

export default App;

