/**
 * API Constants
 * Centralized configuration for all backend API endpoints
 */

// Base API URL - can be overridden via environment variable
export const API_BASE_URL = "https://published-employers-belly-judy.trycloudflare.com" || 'http://localhost:3000';

// Frontend URL (for redirects)
export const FRONTEND_URL = "https://stockings-shoe-should-demonstrate.trycloudflare.com" || window.location.origin;

// API Endpoints
export const API_ENDPOINTS = {
  // Settings
  SETTINGS: '/api/settings',
  
  // Subscriptions
  SUBSCRIPTIONS: {
    VAPID_PUBLIC_KEY: '/api/subscriptions/vapid-public-key',
    SUBSCRIBE: '/api/subscriptions/subscribe',
    TEST: '/api/subscriptions/test',
  },
  
  // Authentication
  AUTH: {
    DECRYPT_USER_DATA: '/api/auth/decrypt-user-data',
    GENERATE_TOKEN: '/api/auth/generate-token',
    VALIDATE_TOKEN: '/api/auth/validate-token',
  },
  
  // OAuth
  OAUTH: {
    STATUS: '/oauth/status',
    AUTHORIZE: '/oauth/authorize',
  },
};

/**
 * Build full URL for an API endpoint
 * @param {string} endpoint - API endpoint path
 * @returns {string} Full URL
 */
export const buildApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

/**
 * Get full URL for settings endpoint
 */
export const getSettingsUrl = () => buildApiUrl(API_ENDPOINTS.SETTINGS);

/**
 * Get full URL for VAPID public key endpoint
 */
export const getVapidPublicKeyUrl = () => buildApiUrl(API_ENDPOINTS.SUBSCRIPTIONS.VAPID_PUBLIC_KEY);

/**
 * Get full URL for subscription endpoint
 */
export const getSubscribeUrl = () => buildApiUrl(API_ENDPOINTS.SUBSCRIPTIONS.SUBSCRIBE);

/**
 * Get full URL for test notification endpoint
 */
export const getTestNotificationUrl = () => buildApiUrl(API_ENDPOINTS.SUBSCRIPTIONS.TEST);

/**
 * Get full URL for decrypt user data endpoint
 */
export const getDecryptUserDataUrl = () => buildApiUrl(API_ENDPOINTS.AUTH.DECRYPT_USER_DATA);

/**
 * Get full URL for OAuth status endpoint
 */
export const getOAuthStatusUrl = () => buildApiUrl(API_ENDPOINTS.OAUTH.STATUS);

/**
 * Get full URL for OAuth authorize endpoint
 */
export const getOAuthAuthorizeUrl = () => buildApiUrl(API_ENDPOINTS.OAUTH.AUTHORIZE);

/**
 * Get full URL for generate token endpoint
 */
export const getGenerateTokenUrl = () => buildApiUrl(API_ENDPOINTS.AUTH.GENERATE_TOKEN);

/**
 * Get full URL for validate token endpoint
 */
export const getValidateTokenUrl = () => buildApiUrl(API_ENDPOINTS.AUTH.VALIDATE_TOKEN);

