import React, { useState } from 'react';
import { useGHLContext } from '../hooks/useGHLContext';
import { APP_UPDATES, FEATURE_REQUEST_CTA, BADGE_CONFIGS } from '../constants/updates';

export default function Header() {
  const { context } = useGHLContext();
  const [showUpdates, setShowUpdates] = useState(false);

  return (
    <header style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ maxWidth: '100%', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/assets/app-icon.svg" 
              alt="NotifyPro" 
              style={{ width: '48px', height: '48px', borderRadius: '12px' }}
            />
            <div>
              <h1 style={{ 
                color: 'white', 
                fontSize: '24px', 
                fontWeight: 'bold', 
                margin: 0,
                lineHeight: 1.2
              }}>
                NotifyPro
              </h1>
              <p style={{ 
                color: 'rgba(255,255,255,0.9)', 
                fontSize: '14px', 
                margin: 0 
              }}>
                Real-time Notifications Dashboard
              </p>
            </div>
          </div>

          {/* Updates & Sub-Account */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Updates Button with Popover */}
            <div style={{ position: 'relative' }}>
              <button
                onMouseEnter={() => setShowUpdates(true)}
                onMouseLeave={() => setShowUpdates(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                  position: 'relative'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <span style={{ fontSize: '18px' }}>⚡</span>
                <span>Updates</span>
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '12px',
                  height: '12px',
                  background: '#52c41a',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></span>
              </button>
              
              {/* Updates Popover */}
              {showUpdates && (
                <div 
                  onMouseEnter={() => setShowUpdates(true)}
                  onMouseLeave={() => setShowUpdates(false)}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '380px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    border: '2px solid #667eea'
                  }}
                >
                  <div style={{ padding: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <span style={{
                        background: '#667eea',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}>
                        UPDATES
                      </span>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', margin: 0 }}>
                        Latest & Upcoming
                      </h3>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {APP_UPDATES.map((update, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'start', gap: '8px', fontSize: '14px' }}>
                          <span style={{ 
                            fontWeight: 'bold', 
                            flexShrink: 0,
                            color: update.color === 'green' ? '#52c41a' : '#1890ff'
                          }}>
                            {update.icon}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ color: '#333' }}>{update.title}</strong>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 'bold',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: update.badge === 'live' ? '#f6ffed' : '#e6f7ff',
                                color: update.badge === 'live' ? '#52c41a' : '#1890ff'
                              }}>
                                {BADGE_CONFIGS[update.badge].label}
                              </span>
                            </div>
                            <p style={{ color: '#666', fontSize: '12px', margin: '4px 0 0' }}>
                              {update.description}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      <div style={{
                        background: '#e6f7ff',
                        borderRadius: '8px',
                        padding: '12px',
                        marginTop: '8px',
                        border: '1px solid #91d5ff'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '8px', fontSize: '14px' }}>
                          <span style={{ color: '#1890ff', fontWeight: 'bold', flexShrink: 0 }}>
                            {FEATURE_REQUEST_CTA.icon}
                          </span>
                          <div>
                            <strong style={{ color: '#0050b3' }}>{FEATURE_REQUEST_CTA.title}</strong>
                            <p style={{ color: '#0050b3', fontSize: '12px', margin: '4px 0 0' }}>
                              {FEATURE_REQUEST_CTA.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-Account Name */}
            {context && (
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '8px',
                padding: '12px 20px',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px'
              }}>
                <div style={{ 
                  fontSize: '14px', 
                  color: 'rgba(255,255,255,0.8)',
                  fontWeight: '500'
                }}>
                  Sub Account -
                </div>
                <div style={{ 
                  color: 'white', 
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  {context.userName || context.email || 'Account'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </header>
  );
}

