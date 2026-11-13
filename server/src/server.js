import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { getRedisClient } from './lib/redis.js';

const app = createApp();

const server = app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`🚀 Sweety API server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`Allowed Client Origin: ${env.CLIENT_ORIGIN}`);
});

/**
 * Enterprise Graceful Shutdown Handler.
 * Ensures in-flight HTTP requests complete and database connection pools close cleanly.
 *
 * @param {string} signal
 */
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  // Force close after 10 seconds if graceful drainage hangs
  const forceTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out after 10s. Forcing exit.');
    process.exit(1);
  }, 10000);
  forceTimeout.unref();

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error during HTTP server close');
      process.exit(1);
    }

    try {
      // Disconnect Prisma PostgreSQL connection pool
      await prisma.$disconnect();
      logger.info('PostgreSQL connection pool disconnected');

      // Disconnect Redis if connected
      const redis = getRedisClient();
      if (redis) {
        await redis.quit();
        logger.info('Redis client disconnected');
      }

      logger.info('Graceful shutdown completed successfully');
      process.exit(0);
    } catch (shutdownErr) {
      logger.error({ err: shutdownErr }, 'Error during resource disconnection');
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
