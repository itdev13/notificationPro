import { useEffect, useState, useRef } from 'react';
import { getDecryptUserDataUrl, getOAuthStatusUrl, FRONTEND_URL } from '../constants/api';

/**
 * Hook to get user context from parent application
 * Returns: { locationId, companyId, userId, email, userName, type }
 */
export const useGHLContext = () => {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const attemptCountRef = useRef(0);
  const resolvedRef = useRef(false);
  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    let timeoutId;
    let messageHandler;
    
    // Skip if already resolved (prevents React StrictMode double-run)
    if (resolvedRef.current) {
      console.log('⏭️ Skipping - already resolved');
      return;
    }
    
    const initGHL = async () => {
      try {
        // Initialize user context
        const getUserContext = async () => {
          return new Promise((resolve, reject) => {
            let localTimeoutId;
            
            messageHandler = ({ data, origin }) => {
              // Verify origin
              if (!origin.includes('gohighlevel.com') && !origin.includes('leadconnectorhq.com')) {
                return;
              }

              // Response with encrypted user data
              if (data.message === 'REQUEST_USER_DATA_RESPONSE' && !resolvedRef.current) {
                // Clear timeout immediately!
                if (localTimeoutId) {
                  clearTimeout(localTimeoutId);
                }
                resolvedRef.current = true;
                
                // Use centralized API URL
                fetch(getDecryptUserDataUrl(), {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  credentials: 'include',
                  body: JSON.stringify({ encryptedData: data.payload })
                })
                .then(res => {
                  if (!res.ok) throw new Error(`Authentication failed`);
                  return res.json();
                })
                .then(userData => {
                  resolve(userData);
                })
                .catch(err => {
                  reject(err);
                });
          }
        };

            window.addEventListener('message', messageHandler);
        
            // Request user data from parent
        if (window.parent !== window) {
              window.parent.postMessage({ message: 'REQUEST_USER_DATA' }, '*');
            } else {
              reject(new Error('Not in iframe'));
              return;
        }

            // Timeout after 3 seconds (only if not resolved)
            localTimeoutId = setTimeout(() => {
              if (!resolvedRef.current) {
                reject(new Error('Authentication timeout'));
              }
            }, 3000);
          });
        };

        // Try to get user context
        try {
          const userData = await getUserContext();
          
          const ctx = {
            locationId: userData.activeLocation || userData.locationId,
            companyId: userData.companyId,
            userId: userData.userId,
            email: userData.email,
            userName: userData.userName,
            role: userData.role,
            type: userData.type || (userData.activeLocation ? 'Location' : 'Agency')
          };

          // Check if app is installed (has OAuth token)
          if (ctx.locationId) {
            try {
              const statusResponse = await fetch(`${getOAuthStatusUrl()}?locationId=${ctx.locationId}`);
              const statusData = await statusResponse.json();
              
              if (!statusData.connected) {
                setError('INSTALL_REQUIRED');
                setLoading(false);
                return;
              }
            } catch (statusError) {
              // If status check fails, assume not installed
              console.warn('OAuth status check failed:', statusError);
              setError('INSTALL_REQUIRED');
              setLoading(false);
              return;
            }
          }

          setContext(ctx);
          setLoading(false);

        } catch (err) {
          console.log('err', err, err.message);
          
          // If authentication timeout, check if app is installed
          if (err.message === 'Authentication timeout') {
            // Try to get locationId from URL params first
            const params = new URLSearchParams(window.location.search);
            console.log('params', params);
            const urlLocationId = params.get('location_id') || params.get('locationId');
            console.log('urlLocationId', urlLocationId);
            // If we have locationId, check OAuth status
            if (urlLocationId) {
              try {
                const statusResponse = await fetch(`${getOAuthStatusUrl()}?locationId=${urlLocationId}`);
                const statusData = await statusResponse.json();
                
                if (statusData.connected) {
                  // App is installed but connection is slow
                  setError('SLOW_CONNECTION');
                  setLoading(false);
                  return;
                } else {
                  // App not installed
                  setError('INSTALL_REQUIRED');
                  setLoading(false);
                  return;
                }
              } catch (statusError) {
                // If status check fails, assume slow connection (app might be installed)
                console.warn('OAuth status check failed during timeout:', statusError);
                setError('SLOW_CONNECTION');
                setLoading(false);
                return;
              }
            } else {
              // No locationId available - could be not installed or slow connection
              // Try to check if we can get any location info
              setError('SLOW_CONNECTION');
              setLoading(false);
              return;
            }
          }

           // Check if max attempts reached
           if (err.message === 'MAX_ATTEMPTS_REACHED' || attemptCountRef.current >= MAX_ATTEMPTS) {
            setError('INSTALL_REQUIRED');
            setLoading(false);
            return;
          }

          // Fallback: URL parameters (for development/testing)
          const params = new URLSearchParams(window.location.search);
          const urlLocationId = params.get('location_id') || params.get('locationId');
          const urlUserId = params.get('user_id') || params.get('userId');
          const urlCompanyId = params.get('company_id') || params.get('companyId');

          if (urlLocationId && urlUserId) {
            setContext({
              locationId: urlLocationId,
              companyId: urlCompanyId || 'unknown',
              userId: urlUserId,
              type: 'Location'
            });
            setLoading(false);
          } else {
            // No context available - redirect to about page on backend
            if (!window.location.pathname.includes('about.html')) {
              window.location.href = `https://notificationproapi.vaultsuite.store/about.html`;
            } else {
              // Already on about.html, don't redirect
              setLoading(false);
            }
          }
        }
      } catch (err) {
        console.error('❌ GHL Context Error:', err);
        setError(err.message || 'Context initialization failed');
        setLoading(false);
      }
    };

    initGHL();

    // Cleanup
    return () => {
      if (messageHandler) {
        window.removeEventListener('message', messageHandler);
      }
    };
  }, []);

  return { context, loading, error };
};

