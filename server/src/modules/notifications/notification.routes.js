import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { notificationController } from './notification.controller.js';

export const notificationRouter = Router();

// Require authentication for notification endpoints
notificationRouter.use(authenticate);

notificationRouter.get('/vapid-public-key', notificationController.getVapidPublicKey);
notificationRouter.post('/subscribe', notificationController.subscribe);
notificationRouter.post('/unsubscribe', notificationController.unsubscribe);
notificationRouter.post('/test', notificationController.sendTest);
