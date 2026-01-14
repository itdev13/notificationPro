import React, { useState } from 'react';
import { useGHLContext } from './hooks/useGHLContext';
import { Card, Button, message, Alert, Spin } from 'antd';
import { BellOutlined, RocketOutlined, CheckCircleOutlined, SettingOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { getGenerateTokenUrl } from './constants/api';
import Header from './components/Header';
import SettingsTab from './components/SettingsTab';
import SupportTab from './components/SupportTab';

function LandingPage() {
  const { context, loading: contextLoading, error: contextError } = useGHLContext();
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // home, settings, support

  const handleOpenSettings = async () => {
    try {
      setGenerating(true);
      
      // Generate secure token from backend
      const response = await axios.post(getGenerateTokenUrl(), {
        locationId: context.locationId,
        userId: context.userId,
        companyId: context.companyId,
        email: context.email,
        userName: context.userName,
        type: context.type
      });

      const { token } = response.data;
      
      // Open settings in new window with token
      const settingsUrl = `${window.location.origin}/settings?token=${token}`;
      const newWindow = window.open(
        settingsUrl,
        'NotifyProSettings',
        'width=1200,height=900,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes'
      );

      if (newWindow) {
        message.success('Settings window opened! Enable notifications there.');
      } else {
        message.error('Popup blocked. Please allow popups for this site.');
      }
      
    } catch (error) {
      console.error('Error generating token:', error);
      message.error('Failed to open settings. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (contextLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <h2 style={{ marginTop: '20px' }}>Loading NotifyPro...</h2>
      </div>
    );
  }

  if (contextError === 'INSTALL_REQUIRED') {
    return (
      <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
        <Alert
          type="warning"
          message="App Not Installed"
          description="NotifyPro needs to be installed first. Please complete the OAuth installation."
          showIcon
        />
      </div>
    );
  }

  if (!context) {
    return (
      <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
        <Alert
          type="error"
          message="Failed to Load"
          description="Unable to get user context. Please refresh the page."
          showIcon
        />
      </div>
    );
  }

  // Tabs definition
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'support', label: 'Support', icon: '🆘' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Tab Navigation */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '24px',
          overflow: 'hidden'
        }}>
          <div style={{ borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '16px 32px',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '3px solid #667eea' : '3px solid transparent',
                    background: activeTab === tab.id ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
                    color: activeTab === tab.id ? '#667eea' : '#666',
                    fontSize: '16px',
                    fontWeight: activeTab === tab.id ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '32px'
        }}>
          {activeTab === 'home' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <Card 
                style={{ 
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: 'none'
                }}
              >
        <div style={{ textAlign: 'center' }}>
          {/* Icon */}
          <div style={{ 
            fontSize: '64px', 
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🔔
          </div>

          {/* Title */}
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            color: '#1a1a1a'
          }}>
            Enable Push Notifications
          </h1>

          {/* Subtitle */}
          <p style={{ 
            fontSize: '16px', 
            color: '#666', 
            marginBottom: '30px',
            lineHeight: '1.6'
          }}>
            Get instant browser notifications when new messages arrive in GoHighLevel
          </p>

          {/* Features */}
          <div style={{ 
            textAlign: 'left', 
            marginBottom: '30px',
            background: '#f9fafb',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>
              What you'll get:
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                <span style={{ color: '#555' }}>Real-time notifications for new messages</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                <span style={{ color: '#555' }}>Works even when browser is minimized</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                <span style={{ color: '#555' }}>Customizable notification preferences</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                <span style={{ color: '#555' }}>Email and Slack integration options</span>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert
            type="info"
            message="Quick Setup Required"
            description="To enable browser push notifications, we'll open a settings page in a new window where you can grant permission. This only takes a few seconds!"
            style={{ marginBottom: '24px', textAlign: 'left' }}
            showIcon
          />

          {/* CTA Button */}
          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            onClick={handleOpenSettings}
            loading={generating}
            style={{
              height: '50px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '8px',
              width: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            {generating ? 'Opening Settings...' : 'Open Notification Settings'}
          </Button>

          {/* Footer Note */}
          <p style={{ 
            fontSize: '13px', 
            color: '#999', 
            marginTop: '20px',
            lineHeight: '1.5'
          }}>
            <BellOutlined /> Your notification preferences are stored securely and can be changed anytime.
          </p>
        </div>
              </Card>
            </div>
          )}

          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'support' && <SupportTab />}
        </div>
      </div>
    </div>
  );
}

export default LandingPage;

