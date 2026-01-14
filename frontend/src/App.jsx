import React, { useState, useEffect, useRef } from 'react';
import { Card, Switch, Input, TimePicker, Select, Tag, Button, message, Divider, Alert, Spin } from 'antd';
import { BellOutlined, MailOutlined, SlackOutlined, ClockCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { 
  getSettingsUrl, 
  getVapidPublicKeyUrl, 
  getSubscribeUrl, 
  getTestNotificationUrl,
  getValidateTokenUrl
} from './constants/api';

const { TextArea } = Input;
const { Option } = Select;

function App() {
  const [context, setContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [pushSupported, setPushSupported] = useState(false);
  const tokenValidatedRef = useRef(false); // Prevent double validation in React.StrictMode

  // Validate token and load context on mount
  useEffect(() => {
    const validateToken = async () => {
      // Skip if already validated (prevents React.StrictMode double-call)
      if (tokenValidatedRef.current) {
        console.log('Token already validated, skipping...');
        return;
      }
      
      tokenValidatedRef.current = true;
      
      try {
        setContextLoading(true);
        
        // Get token from URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        
        if (!token) {
          setContextError('No token provided. Please open settings from the main page.');
          setContextLoading(false);
          return;
        }

        console.log('Validating token...');
        
        // Validate token with backend
        const response = await axios.post(getValidateTokenUrl(), { token });
        
        if (response.data.success && response.data.context) {
          setContext(response.data.context);
          setContextError(null);
          console.log('Token validated successfully!');
        } else {
          setContextError('Invalid or expired token. Please try again.');
        }
        
      } catch (error) {
        console.error('Token validation error:', error);
        
        let errorMsg = 'Failed to validate token. Please try again.';
        
        if (error.response?.status === 401) {
          const responseError = error.response?.data?.error || '';
          if (responseError.includes('already been used')) {
            errorMsg = 'This link has already been used. Please close this window and generate a new link from the main page.';
          } else if (responseError.includes('expired')) {
            errorMsg = 'This link has expired (15 min limit). Please close this window and generate a new link.';
          } else {
            errorMsg = 'Invalid or expired link. Please close this window and try again.';
          }
        }
        
        setContextError(errorMsg);
      } finally {
        setContextLoading(false);
      }
    };

    validateToken();
  }, []);

  // Load preferences when context is available
  useEffect(() => {
    if (context?.locationId) {
      loadPreferences();
      checkPushSupport();
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
      message.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const checkPushSupport = async () => {
    console.log("=== CHECKING PUSH SUPPORT ===");
    console.log("Current origin:", window.location.origin);
    
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    console.log("Push supported:", supported);
    console.log("Notification.permission:", Notification.permission);
    
    setPushSupported(supported);
    
    if (supported) {
      // Check if we already have an active subscription
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription && Notification.permission === 'granted') {
          console.log('Found existing subscription - auto-enabling push');
          // Auto-enable if we have subscription
          if (preferences?.channels?.push) {
            setPreferences(prev => ({
              ...prev,
              channels: {
                ...prev.channels,
                push: { ...prev.channels.push, enabled: true }
              }
            }));
          }
        }
      } catch (error) {
        console.log('Error checking existing subscription:', error);
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.post(getSettingsUrl(), {
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

  const subscribeToPush = async () => {
    try {
      // Register service worker and subscribe
      console.log('Registering service worker...');
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service worker registered:', registration);
      
      console.log('Getting VAPID public key from:', getVapidPublicKeyUrl());
      const vapidResponse = await axios.get(getVapidPublicKeyUrl());
      console.log('VAPID key response:', vapidResponse.data);
      
      // Handle different response formats
      const vapidPublicKey = vapidResponse.data?.publicKey || vapidResponse.data?.data?.publicKey;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not found in response');
      }
      console.log('VAPID public key extracted:', vapidPublicKey.substring(0, 20) + '...');
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      console.log('Existing subscription:', subscription ? 'Found' : 'None');
      
      // If no subscription, create new one
      if (!subscription) {
        console.log('Creating new subscription...');
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidPublicKey
          });
          console.log('New subscription created');
      }

      // Save subscription to backend
      console.log('Saving subscription to backend...');
      console.log('Subscription data:', {
        locationId: context.locationId,
        endpoint: subscription.endpoint,
        keys: subscription.keys ? 'present' : 'missing'
      });
      
      const subscribeResponse = await axios.post(getSubscribeUrl(), {
        locationId: context.locationId,
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent
      });
      console.log('Subscription saved to backend:', subscribeResponse.data);

      message.success('Push notifications enabled!');
      
      // Update preferences to enable push
      setPreferences(prev => ({
        ...prev,
        channels: {
          ...prev.channels,
          push: { ...prev.channels.push, enabled: true }
        }
      }));
    } catch (error) {
      console.error('Error subscribing to push:', error);
      
      // More specific error messages
      let errorMessage = 'Failed to subscribe to push notifications';
      let errorDetails = '';
      
      if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          errorMessage = 'Authentication failed';
          errorDetails = 'Your session may have expired. Please refresh the page and try again.';
        } else if (status === 404) {
          errorMessage = 'Service not found';
          errorDetails = `The subscription endpoint (${getSubscribeUrl()}) was not found. Please check your backend configuration.`;
        } else if (status === 400) {
          errorMessage = 'Invalid request';
          errorDetails = data?.error || data?.message || 'Please check your subscription data.';
        } else if (status >= 500) {
          errorMessage = 'Server error';
          errorDetails = 'The server encountered an error. Please try again later.';
        } else {
          errorMessage = `Request failed (${status})`;
          errorDetails = data?.error || data?.message || error.message;
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Network error';
        errorDetails = 'Unable to reach the server. Please check your internet connection and backend URL.';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Permission denied';
        errorDetails = 'Notification permission was denied. Please enable notifications in your browser settings.';
      } else if (error.message?.includes('service worker')) {
        errorMessage = 'Service worker error';
        errorDetails = 'Service worker registration failed. Please check browser console for details.';
      } else {
        errorDetails = error.message || 'Unknown error occurred';
      }
      
      console.error('Subscribe error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      message.error({
        content: (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{errorMessage}</div>
            {errorDetails && <div style={{ fontSize: '12px' }}>{errorDetails}</div>}
          </div>
        ),
        duration: 8
      });
      
      throw error;
    }
  };

  const sendTestNotification = async (channel) => {
    try {
      await axios.post(getTestNotificationUrl(), {
        locationId: context.locationId,
        channel
      });
      message.success(`Test ${channel} notification sent!`);
    } catch (error) {
      message.error(error.response?.data?.error || 'Test failed');
    }
  };

  if (contextLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <h2 style={{ marginTop: '20px' }}>Validating session...</h2>
      </div>
    );
  }

  if (contextError) {
    return (
      <div style={{ maxWidth: '600px', margin: '100px auto', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px' }}>
          Session Error
        </h1>
        <Alert
          type="error"
          message="Authentication Failed"
          description={contextError}
          style={{ marginBottom: '30px', textAlign: 'left' }}
        />
        <Button
          type="primary"
          size="large"
          onClick={() => window.close()}
          style={{ minWidth: '200px', height: '48px', fontSize: '16px' }}
        >
          Close Window
        </Button>
        <p style={{ marginTop: '20px', fontSize: '14px', color: '#999' }}>
          Please return to the main page and try again
        </p>
      </div>
    );
  }

  if (!context) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Alert
          type="error"
          message="No Context Available"
          description="Unable to load user context. Please close this window and try again."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <h2 style={{ marginTop: '20px' }}>Loading settings...</h2>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Alert
          type="error"
          message="Error Loading Preferences"
          description="Failed to load notification settings. Please try refreshing the page."
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Success banner */}
      <Alert
        type="success"
        message="🚀 Settings Window Active"
        description={
          <div>
            <p style={{ marginBottom: '4px' }}>
              You've successfully opened the settings window. Browser push notifications are available here!
            </p>
            <p style={{ marginBottom: '0', fontSize: '12px', color: '#666' }}>
              Location: <code>{context.locationId}</code> | User: {context.userName || context.email || context.userId}
            </p>
          </div>
        }
        closable
        style={{ marginBottom: '20px' }}
      />
      
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
              onChange={async (checked) => {
                if (checked) {
                  try {
                    const permission = await Notification.requestPermission();
                    console.log('Notification permission:', permission);
                    
                    if (permission === 'granted') {
                      await subscribeToPush();
                    } else {
                      message.error('Please allow notifications in your browser and try again');
                      setPreferences(prev => ({
                        ...prev,
                        channels: { ...prev.channels, push: { ...prev.channels.push, enabled: false }}
                      }));
                    }
                  } catch (error) {
                    console.error('Error:', error);
                    message.error('Failed to enable notifications');
                    setPreferences(prev => ({
                      ...prev,
                      channels: { ...prev.channels, push: { ...prev.channels.push, enabled: false }}
                    }));
                  }
                } else {
                  setPreferences(prev => ({
                    ...prev,
                    channels: { ...prev.channels, push: { ...prev.channels.push, enabled: false }}
                  }));
                }
              }}
              disabled={!pushSupported}
            />
          </div>
          {!pushSupported && (
            <Alert type="warning" message="Push notifications not supported in this browser" style={{ marginTop: '10px' }} />
          )}
          {Notification.permission === 'denied' && (
            <Alert 
              type="warning" 
              message="Notifications Blocked" 
              description="Notifications are currently blocked in your browser. Click the lock icon in the address bar and allow notifications, then refresh this page."
              style={{ marginTop: '10px' }} 
            />
          )}
          {preferences.channels.push.enabled && (
            <div style={{ marginTop: '15px', padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #91d5ff' }}>
              <p style={{ fontSize: '14px', color: '#0050b3', marginBottom: '12px' }}>
                ✅ Browser push notifications are enabled! Test it below:
              </p>
              <Button 
                type="primary"
                size="small" 
                onClick={() => sendTestNotification('push')}
              >
                Send Test Notification
              </Button>
            </div>
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
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Business Hours (Time Range):</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Input
                    type="time"
                    value={preferences.filters.businessHours.start || '09:00'}
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
                    style={{ flex: 1 }}
                  />
                  <span style={{ alignSelf: 'center', fontWeight: '500' }}>to</span>
                  <Input
                    type="time"
                    value={preferences.filters.businessHours.end || '17:00'}
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
                    style={{ flex: 1 }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                  Set the time range for business hours (e.g., 9:00 AM to 5:00 PM)
                </p>
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
                  showSearch
                  placeholder="Select timezone"
                  optionFilterProp="children"
                >
                  <Option value="America/New_York">US Eastern Time (ET) - New York</Option>
                  <Option value="America/Chicago">US Central Time (CT) - Chicago</Option>
                  <Option value="America/Denver">US Mountain Time (MT) - Denver</Option>
                  <Option value="America/Los_Angeles">US Pacific Time (PT) - Los Angeles</Option>
                  <Option value="America/Phoenix">US Arizona - Phoenix (No DST)</Option>
                  <Option value="America/Anchorage">US Alaska Time (AKT)</Option>
                  <Option value="Pacific/Honolulu">US Hawaii Time (HST)</Option>
                  <Option value="America/Toronto">Canada Eastern - Toronto</Option>
                  <Option value="America/Vancouver">Canada Pacific - Vancouver</Option>
                  <Option value="Europe/London">UK - London (GMT/BST)</Option>
                  <Option value="Europe/Paris">France - Paris (CET)</Option>
                  <Option value="Europe/Berlin">Germany - Berlin (CET)</Option>
                  <Option value="Europe/Madrid">Spain - Madrid (CET)</Option>
                  <Option value="Europe/Rome">Italy - Rome (CET)</Option>
                  <Option value="Europe/Amsterdam">Netherlands - Amsterdam (CET)</Option>
                  <Option value="Europe/Brussels">Belgium - Brussels (CET)</Option>
                  <Option value="Europe/Zurich">Switzerland - Zurich (CET)</Option>
                  <Option value="Europe/Stockholm">Sweden - Stockholm (CET)</Option>
                  <Option value="Europe/Dublin">Ireland - Dublin (GMT/IST)</Option>
                  <Option value="Asia/Dubai">UAE - Dubai (GST)</Option>
                  <Option value="Asia/Kolkata">India - Kolkata (IST)</Option>
                  <Option value="Asia/Singapore">Singapore (SGT)</Option>
                  <Option value="Asia/Hong_Kong">Hong Kong (HKT)</Option>
                  <Option value="Asia/Tokyo">Japan - Tokyo (JST)</Option>
                  <Option value="Asia/Seoul">South Korea - Seoul (KST)</Option>
                  <Option value="Asia/Shanghai">China - Shanghai (CST)</Option>
                  <Option value="Asia/Bangkok">Thailand - Bangkok (ICT)</Option>
                  <Option value="Asia/Jakarta">Indonesia - Jakarta (WIB)</Option>
                  <Option value="Asia/Manila">Philippines - Manila (PHT)</Option>
                  <Option value="Australia/Sydney">Australia - Sydney (AEDT)</Option>
                  <Option value="Australia/Melbourne">Australia - Melbourne (AEDT)</Option>
                  <Option value="Australia/Brisbane">Australia - Brisbane (AEST)</Option>
                  <Option value="Australia/Perth">Australia - Perth (AWST)</Option>
                  <Option value="Pacific/Auckland">New Zealand - Auckland (NZDT)</Option>
                  <Option value="America/Sao_Paulo">Brazil - São Paulo (BRT)</Option>
                  <Option value="America/Mexico_City">Mexico - Mexico City (CST)</Option>
                  <Option value="America/Argentina/Buenos_Aires">Argentina - Buenos Aires (ART)</Option>
                  <Option value="Africa/Johannesburg">South Africa - Johannesburg (SAST)</Option>
                  <Option value="Africa/Lagos">Nigeria - Lagos (WAT)</Option>
                  <Option value="Africa/Cairo">Egypt - Cairo (EET)</Option>
                  <Option value="Africa/Nairobi">Kenya - Nairobi (EAT)</Option>
                </Select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Business Days:</label>
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  value={preferences.filters.businessHours.days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']}
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
                  placeholder="Select business days (default: Monday-Friday)"
                >
                  <Option value="monday">Monday</Option>
                  <Option value="tuesday">Tuesday</Option>
                  <Option value="wednesday">Wednesday</Option>
                  <Option value="thursday">Thursday</Option>
                  <Option value="friday">Friday</Option>
                  <Option value="saturday">Saturday</Option>
                  <Option value="sunday">Sunday</Option>
                </Select>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                  Select the days when you want to receive notifications. Default: Monday-Friday
                </p>
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
      <div style={{ textAlign: 'center', marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <Button
          type="primary"
          size="large"
          loading={saving}
          onClick={handleSave}
          style={{ minWidth: '200px' }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button
          size="large"
          onClick={() => {
            message.success('Settings saved! You can close this window now.');
            setTimeout(() => window.close(), 1500);
          }}
          style={{ minWidth: '200px' }}
        >
          Save & Close Window
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

