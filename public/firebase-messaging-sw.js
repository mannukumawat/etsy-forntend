importScripts('https://www.gstatic.com/firebasejs/13.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/13.4.0/firebase-messaging-compat.js');

// Config injected at build time via VITE_FIREBASE_* env vars in the main app,
// but service workers can't import ES modules, so we self-configure here.
// The SW receives the config via a postMessage from the main thread on registration.
let messaging;
self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    if (!messaging) {
      firebase.initializeApp(event.data.config);
      messaging = firebase.messaging();
      messaging.onBackgroundMessage((payload) => {
        const { title, body, link } = payload.notification ?? payload.data ?? {};
        self.registration.showNotification(title ?? 'New notification', {
          body,
          data: { link },
          icon: '/favicon.png',
        });
      });
    }
  }
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link;
  if (link) {
    event.waitUntil(clients.openWindow(link));
  }
});
