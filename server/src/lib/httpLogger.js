import pinoHttp from 'pino-http';
import { logger } from './logger.js';
import { env } from '../config/env.js';

/**
 * Pino HTTP request logging middleware.
 * Automatically disabled during test runs to keep test outputs clean.
 */
export const httpLogger = pinoHttp({
  logger,
  autoLogging: env.NODE_ENV !== 'test',
  genReqId: (req) => req.id || req.headers['x-request-id'],
});

