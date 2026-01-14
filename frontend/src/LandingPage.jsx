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
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <img 
              src="/assets/app-icon.svg" 
              alt="NotifyPro" 
              style={{ width: '80px', height: '80px', marginBottom: '20px' }}
            />
            <Spin size="large" />
            <h2 style={{ marginTop: '20px', color: '#333', fontSize: '24px', fontWeight: 'bold' }}>
              Loading NotifyPro...
            </h2>
            <p style={{ color: '#999', fontSize: '14px', marginTop: '8px' }}>
              Connecting to your GHL account
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (contextError === 'INSTALL_REQUIRED') {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          width: '100%',
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔌</div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
            App Not Installed
          </h1>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
            NotifyPro needs to be installed and connected to your GoHighLevel account to work properly.
          </p>
          
          <Alert
            type="warning"
            message="Installation Required"
            description="This is a preview. The app must be installed via OAuth to receive notifications and access all features."
            style={{ marginBottom: '30px', textAlign: 'left' }}
            showIcon
          />

          <button
            onClick={() => window.location.href = '/oauth/authorize'}
            style={{
              width: '100%',
              height: '48px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Install NotifyPro
          </button>
          
          <p style={{ fontSize: '13px', color: '#999', marginTop: '20px' }}>
            You will be redirected to authorize the app
          </p>
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          width: '100%',
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏱️</div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
            Connection Issue
          </h1>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
            Unable to load your account details. This usually happens due to:
          </p>
          
          <div style={{ 
            background: '#f9fafb', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '30px',
            textAlign: 'left'
          }}>
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'start', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🌐</span>
              <span style={{ color: '#666' }}>Slow or unstable internet connection</span>
            </div>
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'start', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>⏳</span>
              <span style={{ color: '#666' }}>Server taking longer than usual to respond</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🔌</span>
              <span style={{ color: '#666' }}>App not properly installed in GoHighLevel</span>
            </div>
          </div>

          <Alert
            type="info"
            message="💡 Quick Fix"
            description="Check your internet connection and try refreshing the page. If the issue persists, make sure the app is properly installed in your GHL account."
            style={{ marginBottom: '24px', textAlign: 'left' }}
            showIcon
          />

          <button
            onClick={() => window.location.reload()}
            style={{
              width: '100%',
              height: '48px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            🔄 Refresh Page
          </button>
          
          <p style={{ fontSize: '13px', color: '#999', marginTop: '20px' }}>
            Still having issues? Contact support for assistance.
          </p>
        </div>
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

