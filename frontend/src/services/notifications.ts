/**
 * Web Push Notification helpers for LaserHub.
 *
 * Usage:
 *   1. Call subscribeToPush() after the user grants permission.
 *   2. The service worker (src/sw.ts) receives push events and shows the
 *      OS-level notification.
 *
 * When push is not available (no service worker / no PushManager), the module
 * falls back to the basic Notification API (`new Notification()`) so the user
 * can still receive browser-level alerts for order updates.
 */

import api from './api';

// ---------------------------------------------------------------------------
// API wrappers
// ---------------------------------------------------------------------------

export const notificationApi = {
  /** Fetch the VAPID public key from the backend (no auth required). */
  getVapidPublicKey: async (): Promise<string> => {
    const { data } = await api.get<{ public_key: string }>('/notifications/vapid-public-key');
    return data.public_key;
  },

  /** Register a PushSubscription with the backend. */
  subscribe: async (subscription: PushSubscriptionJSON): Promise<void> => {
    const keys = subscription.keys as { p256dh: string; auth: string } | undefined;
    if (!subscription.endpoint || !keys?.p256dh || !keys?.auth) {
      throw new Error('Invalid push subscription object — missing required fields');
    }
    await api.post('/notifications/subscribe', {
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });
  },

  /** Remove the subscription from the backend. */
  unsubscribe: async (subscription: PushSubscriptionJSON): Promise<void> => {
    const keys = subscription.keys as { p256dh: string; auth: string } | undefined;
    if (!subscription.endpoint || !keys?.p256dh || !keys?.auth) return;
    await api.delete('/notifications/unsubscribe', {
      data: {
        endpoint: subscription.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });
  },
};

// ---------------------------------------------------------------------------
// Helper: base64url → Uint8Array (required for applicationServerKey)
// ---------------------------------------------------------------------------

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return buffer;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Returns true if the browser supports the full Web Push flow (SW + PushManager). */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Returns true if the browser supports at least basic notifications
 * (the Notification API without requiring a service worker).
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Ask the user for notification permission.
 * Returns true if the permission is (or becomes) 'granted'.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Full subscribe flow:
 *  1. Request OS permission (if not already granted).
 *  2. If push is supported, register the full push subscription.
 *  3. If only basic Notification is available, just request permission
 *     so the app can use `new Notification()` for alerts.
 *
 * Safe to call multiple times — idempotent on the backend side.
 */
export async function subscribeToPush(): Promise<void> {
  const permission = await requestNotificationPermission();
  if (!permission) return;

  // If full push is not supported, we are done — the app can now use
  // `new Notification()` for browser-level alerts.
  if (!isPushSupported()) return;

  try {
    const vapidKey = await notificationApi.getVapidPublicKey();
    const reg = await navigator.serviceWorker.ready;

    // Re-use an existing subscription rather than creating a duplicate
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await notificationApi.subscribe(existing.toJSON());
      return;
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    await notificationApi.subscribe(sub.toJSON());
  } catch (err) {
    // Non-fatal — log and continue so the rest of the app is unaffected
    console.warn('[LaserHub] Push subscription failed:', err);
  }
}

/**
 * Show a basic browser notification (works without service worker).
 * Falls back silently if permission has not been granted.
 */
export function showNotification(title: string, options?: NotificationOptions): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, options);
  } catch {
    // Some environments (e.g. Android Chrome) require SW for Notification
    console.debug('[LaserHub] Basic Notification constructor not supported');
  }
}

/**
 * Unsubscribe from push and remove the subscription from the backend.
 */
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await notificationApi.unsubscribe(sub.toJSON());
    await sub.unsubscribe();
  } catch (err) {
    console.warn('[LaserHub] Push unsubscribe failed:', err);
  }
}
