import React, { useState } from 'react';
import { useGHLContext } from './hooks/useGHLContext';
import { Alert, Spin } from 'antd';
import Header from './components/Header';
import SettingsTab from './components/SettingsTab';
import SupportTab from './components/SupportTab';

function LandingPage() {
  const { context, loading: contextLoading, error: contextError } = useGHLContext();
  const [activeTab, setActiveTab] = useState('settings'); // settings, support

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
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'support', label: 'Support', icon: '🆘' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Tab Navigation - Modern Card Design */}
        <div style={{ 
          display: 'flex',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '20px',
                border: activeTab === tab.id ? '2px solid #667eea' : '2px solid #e0e0e0',
                borderRadius: '16px',
                background: activeTab === tab.id 
                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)'
                  : 'white',
                color: activeTab === tab.id ? '#667eea' : '#666',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: activeTab === tab.id 
                  ? '0 4px 12px rgba(102, 126, 234, 0.15)'
                  : '0 2px 8px rgba(0,0,0,0.08)',
                transform: activeTab === tab.id ? 'translateY(-2px)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              <span style={{ fontSize: '32px' }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div style={{
                  width: '40px',
                  height: '4px',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '2px',
                  marginTop: '4px'
                }}></div>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '32px'
        }}>
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'support' && <SupportTab />}
        </div>
      </div>
    </div>
  );
}

export default LandingPage;

