/**
 * App Updates & Feature Announcements
 */

export const APP_UPDATES = [
  {
    icon: '✅',
    color: 'green',
    title: 'Browser Push Notifications',
    description: 'Real-time notifications with sound, even when browser is minimized',
    badge: 'live'
  },
  {
    icon: '💬',
    color: 'green',
    title: 'Slack Integration',
    description: 'Send notifications directly to your Slack channels',
    badge: 'live'
  },
  {
    icon: '⏰',
    color: 'green',
    title: 'Business Hours Filter',
    description: 'Control when to receive notifications based on your schedule',
    badge: 'live'
  },
  {
    icon: '🎯',
    color: 'green',
    title: 'Priority Keywords',
    description: 'Never miss important messages with keyword alerts',
    badge: 'live'
  },
  {
    icon: '📧',
    color: 'blue',
    title: 'Email Notifications',
    description: 'Get notified via email (coming soon)',
    badge: 'soon'
  },
  {
    icon: '📱',
    color: 'blue',
    title: 'SMS Notifications',
    description: 'Receive notifications via text message (coming soon)',
    badge: 'soon'
  }
];

export const BADGE_CONFIGS = {
  live: {
    label: 'LIVE',
    color: 'green'
  },
  soon: {
    label: 'SOON',
    color: 'blue'
  },
  beta: {
    label: 'BETA',
    color: 'orange'
  }
};

export const FEATURE_REQUEST_CTA = {
  icon: '💡',
  title: 'Request a Feature',
  description: 'Have an idea? Let us know what features you\'d like to see next!'
};

