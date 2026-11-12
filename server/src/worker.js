import { Worker } from 'bullmq';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import {
  REMINDER_QUEUE_NAME,
  getReminderQueue,
  getBullMQRedisConnection,
  closeReminderQueue,
} from './modules/reminders/reminder.queue.js';
import { registerDailyReminderJob } from './modules/reminders/reminder.job.js';
import { createReminderProcessor } from './modules/reminders/reminder.processor.js';

let workerInstance = null;

/**
 * Starts the BullMQ background reminder worker process.
 * Exits cleanly with code 0 if REDIS_URL is not set or Redis is unavailable.
 */
export async function startWorker() {
  logger.info('Initializing Sweety BullMQ background worker...');

  // 1. Check if Redis is configured
  if (!env.REDIS_URL || env.REDIS_URL.trim() === '') {
    logger.warn('REDIS_URL is not configured. BullMQ worker is exiting cleanly without crashing.');
    return null;
  }

  const connection = getBullMQRedisConnection();
  if (!connection) {
    logger.warn('Invalid Redis connection settings. BullMQ worker exiting cleanly.');
    return null;
  }

  // 2. Initialize Queue & register recurring cron job
  const queue = getReminderQueue(connection);
  if (!queue) {
    logger.warn('Could not initialize reminder queue. BullMQ worker exiting cleanly.');
    return null;
  }

  await registerDailyReminderJob(queue, env.REMINDER_CRON, env.APP_TIMEZONE);

  // 3. Initialize BullMQ Worker with processor
  try {
    const processor = createReminderProcessor();

    workerInstance = new Worker(REMINDER_QUEUE_NAME, processor, {
      connection,
      concurrency: 1,
    });

    workerInstance.on('completed', (job, result) => {
      logger.info({ jobId: job.id, result }, 'BullMQ reminder job completed successfully');
    });

    workerInstance.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err: err.message }, 'BullMQ reminder job failed');
    });

    workerInstance.on('error', (err) => {
      logger.warn({ err: err.message }, 'BullMQ worker encountered a connection warning');
    });

    logger.info({ queueName: REMINDER_QUEUE_NAME }, 'Sweety BullMQ background worker started and listening');
    return workerInstance;
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to start BullMQ worker — exiting cleanly');
    return null;
  }
}

/**
 * Handles graceful shutdown on SIGINT / SIGTERM.
 */
export async function stopWorker() {
  logger.info('Shutting down BullMQ worker...');
  if (workerInstance) {
    try {
      await workerInstance.close();
    } catch (err) {
      logger.warn({ err: err.message }, 'Error closing BullMQ worker instance');
    }
    workerInstance = null;
  }

  await closeReminderQueue();
  logger.info('BullMQ worker stopped successfully.');
}

// Auto-start worker if invoked directly via node src/worker.js
if (process.argv[1] && process.argv[1].endsWith('worker.js')) {
  startWorker().catch((err) => {
    logger.warn({ err: err.message }, 'Worker failed to initialize — exiting cleanly');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await stopWorker();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await stopWorker();
    process.exit(0);
  });
}
