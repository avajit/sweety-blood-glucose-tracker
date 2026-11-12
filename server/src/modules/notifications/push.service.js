import webPush from 'web-push';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { pushSubscriptionStore as defaultStore } from './push.store.js';

// Configure VAPID identity
if (env.VAPID_SUBJECT && env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  try {
    webPush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to configure VAPID details for Web Push');
  }
}

/**
 * Service orchestrating Web Push notification delivery and subscription lifecycle.
 */
export class PushService {
  /**
   * @param {typeof defaultStore} [store]
   * @param {typeof webPush} [pushEngine]
   */
  constructor(store = defaultStore, pushEngine = webPush) {
    this.store = store;
    this.pushEngine = pushEngine;
  }

  /**
   * Returns the application's VAPID public key for client-side subscription.
   * @returns {string}
   */
  getPublicKey() {
    return env.VAPID_PUBLIC_KEY;
  }

  /**
   * Registers a client push subscription.
   * @param {string} userId
   * @param {object} subscription - { endpoint: string, keys: { p256dh: string, auth: string } }
   */
  async subscribe(userId, subscription) {
    await this.store.save(userId, subscription);
    logger.info({ userId, endpoint: subscription.endpoint }, 'Push subscription registered');
  }

  /**
   * Removes a client push subscription.
   * @param {string} userId
   * @param {string} endpoint
   */
  async unsubscribe(userId, endpoint) {
    await this.store.remove(userId, endpoint);
    logger.info({ userId, endpoint }, 'Push subscription unregistered');
  }

  /**
   * Dispatches a push notification to all registered devices of a patient.
   * Automatically cleans up dead subscriptions (404/410 Gone).
   *
   * @param {string} userId
   * @param {object} payload - Notification payload { title, body, icon, url, data }
   * @returns {Promise<{ sent: number, failed: number }>}
   */
  async sendToUser(userId, payload) {
    const subscriptions = await this.store.getByUser(userId);
    if (!subscriptions || subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const payloadString = JSON.stringify(payload);
    let sent = 0;
    let failed = 0;

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await this.pushEngine.sendNotification(sub, payloadString);
          sent++;
        } catch (err) {
          failed++;
          logger.warn({ err: err.message, status: err.statusCode }, 'Web Push delivery error');
          // RFC 8030: 404 or 410 indicates subscription has expired or unsubscribed
          if (err.statusCode === 404 || err.statusCode === 410) {
            await this.store.remove(userId, sub.endpoint);
          }
        }
      }),
    );

    return { sent, failed };
  }

  /**
   * Sends an immediate test notification to verify client reception.
   * @param {string} userId
   * @returns {Promise<{ sent: number, failed: number }>}
   */
  async sendTestNotification(userId) {
    return this.sendToUser(userId, {
      title: '🔔 Sweety Glucose Reminder',
      body: 'Web push notifications are active! You will receive daily reminders when readings are missing.',
      url: '/dashboard',
      tag: 'sweety-test',
    });
  }
}

export const pushService = new PushService();

