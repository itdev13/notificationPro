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
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'support' && <SupportTab />}
        </div>
      </div>
    </div>
  );
}

export default LandingPage;

