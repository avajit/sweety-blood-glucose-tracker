import { Router } from 'express';
import { registerSchema, loginSchema } from '@sweety/shared/schemas/auth.schema.js';
import { authController } from './auth.controller.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { authRateLimiter } from '../../common/middleware/rateLimit.middleware.js';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validate(registerSchema, 'body'), authController.register);
authRouter.post('/login', authRateLimiter, validate(loginSchema, 'body'), authController.login);
authRouter.post('/refresh', authRateLimiter, authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.getMe);
