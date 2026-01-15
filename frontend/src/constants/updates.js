/**
 * App Updates & Feature Announcements
 */

export const APP_UPDATES = [
  {
    icon: '✅',
    color: 'green',
    title: 'Multi-Webhook Support',
    description: 'InboundMessage + Task webhooks (Complete, Create, Delete)',
    badge: 'live'
  },
  {
    icon: '👤',
    color: 'green',
    title: 'User-Specific Notifications',
    description: 'Only receive notifications assigned to YOU',
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
    icon: '📱',
    color: 'blue',
    title: 'More Webhook Types',
    description: 'Appointments, Opportunities, and more (request via support)',
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

