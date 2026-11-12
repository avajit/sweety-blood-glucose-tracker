import { Queue } from 'bullmq';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

export const REMINDER_QUEUE_NAME = 'sweety-reminders';

let queueInstance = null;

/**
 * Returns connection configuration object for BullMQ.
 * Note: BullMQ requires maxRetriesPerRequest: null.
 *
 * @param {string} [redisUrl]
 * @returns {object}
 */
export function getBullMQRedisConnection(redisUrl = env.REDIS_URL) {
  if (!redisUrl) {
    return null;
  }

  try {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname || '127.0.0.1',
      port: Number(parsed.port) || 6379,
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to parse REDIS_URL for BullMQ connection');
    return null;
  }
}

/**
 * Gets or creates the BullMQ Reminder Queue singleton.
 * Returns null if REDIS_URL is not configured.
 *
 * @param {object} [connectionOverride]
 * @returns {Queue | null}
 */
export function getReminderQueue(connectionOverride = null) {
  if (queueInstance) {
    return queueInstance;
  }

  const connection = connectionOverride || getBullMQRedisConnection();
  if (!connection) {
    return null;
  }

  try {
    queueInstance = new Queue(REMINDER_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
      },
    });

    queueInstance.on('error', (err) => {
      logger.warn({ err: err.message }, 'BullMQ Reminder Queue encountered an error');
    });

    return queueInstance;
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to initialize BullMQ Reminder Queue');
    return null;
  }
}

/**
 * Closes the active Queue connection cleanly.
 */
export async function closeReminderQueue() {
  if (queueInstance) {
    try {
      await queueInstance.close();
    } catch (err) {
      logger.warn({ err: err.message }, 'Error closing Reminder Queue');
    }
    queueInstance = null;
  }
}
