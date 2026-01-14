import React from 'react';
import { useGHLContext } from '../hooks/useGHLContext';

export default function Header() {
  const { context } = useGHLContext();

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
              style={{ width: '40px', height: '40px' }}
            />
            <div>
              <h1 style={{ 
                color: 'white', 
                fontSize: '20px', 
                fontWeight: 'bold', 
                margin: 0,
                lineHeight: 1.2
              }}>
                NotifyPro
              </h1>
              <p style={{ 
                color: 'rgba(255,255,255,0.9)', 
                fontSize: '12px', 
                margin: 0 
              }}>
                Real-time Notifications for GHL
              </p>
            </div>
          </div>

          {/* User Info */}
          {context && (
            <div style={{ 
              color: 'white', 
              fontSize: '14px',
              textAlign: 'right'
            }}>
              <div style={{ fontWeight: '500' }}>
                {context.userName || context.email}
              </div>
              <div style={{ 
                fontSize: '12px', 
                opacity: 0.9 
              }}>
                {context.type}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

