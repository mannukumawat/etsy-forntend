/**
 * Requests FCM permission and registers the token with the backend.
 * Call `requestPermissionAndRegister()` on a user action (button click etc.) — never on mount.
 * Sends the Firebase config to the service worker on first call.
 */
import { useCallback, useRef } from 'react';
import { registerFcmToken } from '@/api/notifications';

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

export function useFcmToken() {
  const registeredRef = useRef(false);

  const requestPermissionAndRegister = useCallback(async () => {
    if (registeredRef.current) return;
    if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId || !VAPID_KEY) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      // Register the service worker
      const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

      // Send the Firebase config to the SW
      swReg.active?.postMessage({ type: 'FIREBASE_CONFIG', config: FIREBASE_CONFIG });
      swReg.installing?.postMessage({ type: 'FIREBASE_CONFIG', config: FIREBASE_CONFIG });
      swReg.waiting?.postMessage({ type: 'FIREBASE_CONFIG', config: FIREBASE_CONFIG });

      // Dynamically import Firebase to avoid loading on pages that don't need it
      const { initializeApp, getApps } = await import('firebase/app');
      const { getMessaging, getToken } = await import('firebase/messaging');

      const app = getApps().length > 0
        ? getApps()[0]!
        : initializeApp(FIREBASE_CONFIG);
      const messaging = getMessaging(app);

      const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
      if (!token) return;

      await registerFcmToken(token);
      registeredRef.current = true;
    } catch (err) {
      console.warn('[fcm] registration failed:', err instanceof Error ? err.message : err);
    }
  }, []);

  return { requestPermissionAndRegister };
}
