/**
 * Device Information & Fingerprinting
 * Helps identify unique browser/device combinations
 */

/**
 * Get browser name
 */
export function getBrowserName() {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Edg/')) return 'Edge';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
  
  return 'Unknown';
}

/**
 * Get OS name
 */
export function getOSName() {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Win')) return 'Windows';
  if (userAgent.includes('Mac')) return 'MacOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  
  return 'Unknown';
}

/**
 * Generate device ID (simple hash of browser+OS+screen)
 * This is stable across sessions but changes if browser/device changes
 */
export function getDeviceId() {
  const browser = getBrowserName();
  const os = getOSName();
  const screen = `${window.screen.width}x${window.screen.height}`;
  const platform = navigator.platform;
  
  // Simple hash
  const str = `${browser}-${os}-${screen}-${platform}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `device_${Math.abs(hash).toString(36)}`;
}

/**
 * Get complete device info
 */
export function getDeviceInfo() {
  return {
    browser: getBrowserName(),
    os: getOSName(),
    deviceId: getDeviceId(),
    userAgent: navigator.userAgent
  };
}

/**
 * Get device display name
 */
export function getDeviceDisplayName() {
  const browser = getBrowserName();
  const os = getOSName();
  return `${browser} on ${os}`;
}

