import { pushService } from './push.service.js';

export const notificationController = {
  /**
   * Retrieves VAPID public key.
   */
  getVapidPublicKey(req, res) {
    const publicKey = pushService.getPublicKey();
    return res.status(200).json({
      data: { publicKey },
    });
  },

  /**
   * Subscribes client browser to push notifications.
   */
  async subscribe(req, res) {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid push subscription object with endpoint and keys is required.',
        },
      });
    }

    await pushService.subscribe(req.user.id, subscription);
    return res.status(201).json({
      data: {
        success: true,
        message: 'Push subscription registered successfully.',
      },
    });
  },

  /**
   * Unsubscribes client from push notifications.
   */
  async unsubscribe(req, res) {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Subscription endpoint is required to unsubscribe.',
        },
      });
    }

    await pushService.unsubscribe(req.user.id, endpoint);
    return res.status(200).json({
      data: {
        success: true,
        message: 'Push subscription unregistered successfully.',
      },
    });
  },

  /**
   * Dispatches an immediate test push notification.
   */
  async sendTest(req, res) {
    const result = await pushService.sendTestNotification(req.user.id);
    return res.status(200).json({
      data: {
        success: true,
        message: 'Test push notification dispatched.',
        stats: result,
      },
    });
  },
};

