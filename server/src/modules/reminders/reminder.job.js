import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

export const REMINDER_JOB_NAME = 'daily-reminder-check';

/**
 * Registers the recurring daily reminder job with BullMQ using the configured cron pattern.
 *
 * @param {import('bullmq').Queue} queue
 * @param {string} [cronPattern]
 * @param {string} [timezone]
 * @returns {Promise<import('bullmq').Job | null>}
 */
export async function registerDailyReminderJob(
  queue,
  cronPattern = env.REMINDER_CRON,
  timezone = env.APP_TIMEZONE,
) {
  if (!queue) {
    logger.warn('Cannot register reminder job: queue instance is not available');
    return null;
  }

  try {
    const job = await queue.add(
      REMINDER_JOB_NAME,
      { triggeredAt: new Date().toISOString() },
      {
        repeat: {
          pattern: cronPattern,
          tz: timezone,
        },
      },
    );

    logger.info(
      { jobName: REMINDER_JOB_NAME, cron: cronPattern, tz: timezone },
      'Registered BullMQ recurring daily reminder job',
    );

    return job;
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to register repeatable reminder job in BullMQ');
    return null;
  }
}
