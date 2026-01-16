import { useEffect, useRef } from 'react';
import { useGHLContext } from './useGHLContext';
import { API_BASE_URL } from '../constants/api';

/**
 * Lightweight analytics hook for NotifyPro
 * Tracks user actions without impacting performance
 */
export function useAnalytics() {
  const { context } = useGHLContext();
  const sessionIdRef = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const trackedAppOpen = useRef(false);

  // Track app opened (once per session)
  useEffect(() => {
    if (context?.locationId && context?.userId && !trackedAppOpen.current) {
      track('app_opened');
      trackedAppOpen.current = true;
    }
  }, [context?.locationId, context?.userId]);

  const track = async (eventType, metadata = {}) => {
    // Skip if no context
    if (!context?.locationId || !context?.userId) {
      return;
    }

    try {
      // Fire and forget - don't await
      fetch(`${API_BASE_URL}/api/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: context.locationId,
          userId: context.userId,
          eventType,
          metadata: {
            ...metadata,
            sessionId: sessionIdRef.current
          }
        })
      }).catch(() => {}); // Silent fail

    } catch (error) {
      // Silent fail - analytics is non-critical
      console.debug('Analytics tracking failed:', error);
    }
  };

  return { track };
}

