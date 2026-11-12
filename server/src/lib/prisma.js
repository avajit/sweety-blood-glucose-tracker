import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

const isDev = env.NODE_ENV === 'development';

/**
 * Singleton Prisma client instance.
 * Shared across repository layer to optimize connection pooling.
 */
export const prisma = new PrismaClient({
  log: isDev ? ['warn', 'error'] : ['error'],
});
