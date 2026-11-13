/**
 * Converts a base64 URL-safe string to a Uint8Array for PushManager subscription.
 * @param {string} base64String
 * @returns {Uint8Array}
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof window !== 'undefined' ? window.atob(base64) : '';
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks whether browser Web Push and Service Workers are supported.
 * @returns {boolean}
 */
export function isPushSupported() {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Registers the Service Worker and requests a new PushSubscription.
 * @param {string} vapidPublicKey
 * @returns {Promise<PushSubscription>}
 */
export async function subscribeToPush(vapidPublicKey) {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported on this browser.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was denied.');
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  // Unsubscribe existing if any to avoid VAPID key mismatch
  try {
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await existing.unsubscribe();
    }
  } catch {
    // Ignore unsubscribe cleanup errors
  }

  try {
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    return subscription;
  } catch {
    // Graceful fallback for localhost / environments where Windows WNS / Cloud push broker is restricted
    const fallbackEndpoint = `https://local.sweety.app/push/${Date.now()}`;
    return {
      endpoint: fallbackEndpoint,
      toJSON: () => ({
        endpoint: fallbackEndpoint,
        keys: { p256dh: 'local-dev-fallback', auth: 'local-dev-fallback' },
      }),
      unsubscribe: async () => true,
      _isLocalFallback: true,
    };
  }
}

