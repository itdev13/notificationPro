/**
 * Service Worker for Push Notifications
 * Handles push events and displays notifications
 * Version: 3.0 - Clean notifications with sound
 */

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker v3.0 installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker v3.0 activated');
  event.waitUntil(clients.claim());
});

// Push event - receives push notification
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  console.log('[SW] Push event data:', event.data ? 'Present' : 'Missing');
  
  let notificationData = {
    title: 'New Message',
    body: 'You have a new message',
    icon: '/icon.png',
    badge: '/badge.png',
    data: {}
  };

  // Parse push data
  if (event.data) {
    try {
      const parsed = event.data.json();
      console.log('[SW] Parsed push data:', parsed);
      notificationData = { ...notificationData, ...parsed };
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
      console.log('[SW] Raw push data:', event.data.text());
    }
  } else {
    console.warn('[SW] No data in push event');
  }

  console.log('[SW] Notification title:', notificationData.title);
  console.log('[SW] Notification body:', notificationData.body);

  // Prepare notification options
  const options = {
    body: notificationData.body || 'You have a new message',
    icon: notificationData.icon || '/icon.png',
    badge: notificationData.badge || '/badge.png',
    vibrate: [200, 100, 200],
    tag: 'notification-' + Date.now(), // Unique tag = separate notifications
    renotify: true, // Force sound/vibration even on updates
    requireInteraction: false,
    silent: false, // Ensure sound plays
    data: notificationData.data || {},
    dir: 'auto',
    lang: 'en'
  };

  console.log('[SW] Showing notification with options:', options);

  // Show notification
  const showNotificationPromise = self.registration.showNotification(
    notificationData.title || 'New Message',
    options
  ).then(() => {
    console.log('[SW] ✅ Notification shown successfully!');
  }).catch((error) => {
    console.error('[SW] ❌ Error showing notification:', error);
    throw error;
  });

  event.waitUntil(showNotificationPromise);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  
  event.notification.close();

  // Open the conversation URL if provided
  if (event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

