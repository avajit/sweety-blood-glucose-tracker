import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { requestIdMiddleware } from './common/middleware/requestId.middleware.js';
import { originCheckMiddleware } from './common/middleware/originCheck.middleware.js';
import { globalRateLimiter } from './common/middleware/rateLimit.middleware.js';
import { errorHandlerMiddleware } from './common/middleware/errorHandler.middleware.js';
import { httpLogger } from './lib/httpLogger.js';
import { healthRouter } from './modules/health/health.routes.js';
import { NotFoundError } from './common/errors/httpErrors.js';

/**
 * Express application factory.
 * Configured with global security, logging, parsers, and error handling.
 * Exported as a factory function to facilitate isolated integration testing.
 *
 * @returns {import('express').Express}
 */
export function createApp() {
  const app = express();

  // Security headers with Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS configured strictly for client origin with cookie credentials
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );

  // Distributed correlation request ID
  app.use(requestIdMiddleware);

  // HTTP request logging
  app.use(httpLogger);

  // Strict CSRF origin check on mutating methods
  app.use(originCheckMiddleware);

  // Cookie and JSON body parsers
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));

  // Global abuse protection rate limiter
  app.use(globalRateLimiter);

  // API Routes
  app.use('/api', healthRouter);

  // 404 Fallback Handler
  app.use((req, _res, next) => {
    next(new NotFoundError(`Endpoint ${req.method} ${req.originalUrl} not found`));
  });

  // Universal Centralized Error Handler
  app.use(errorHandlerMiddleware);

  return app;
}
