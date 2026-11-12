import { prisma } from '../../lib/prisma.js';
import { isRedisAvailable } from '../../lib/redis.js';

/**
 * Basic liveness check.
 * Public endpoint. Returns 200 if the Node.js server process is active.
 *
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 */
export function getHealth(_req, res) {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Deep readiness check.
 * Verifies database connection readiness for cloud load balancers and container orchestrators.
 *
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 */
export async function getReadiness(_req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: isRedisAvailable() ? 'connected' : 'degraded',
    });
  } catch (err) {
    return res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err.message,
    });
  }
}
