import { LIMITS } from '@sweety/shared/constants/limits.js';
import { ROLES } from '@sweety/shared/constants/roles.js';
import { todayInTimezone } from '@sweety/shared/utils/date.js';
import { prisma as defaultPrisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { env } from '../../config/env.js';

/**
 * Default notifier implementation (console logger / email stub).
 */
export const defaultNotifier = {
  /**
   * @param {object} params
   * @param {string} params.patientId
   * @param {string} params.name
   * @param {string} params.email
   * @param {number} params.count
   * @param {number} params.remaining
   * @param {string} params.date
   */
  async sendReminder({ patientId, name, email, count, remaining, date }) {
    logger.info(
      { patientId, email, count, remaining, date },
      `[REMINDER NOTIFICATION] Dear ${name}, you have logged ${count}/4 blood glucose readings for ${date}. Please remember to log your remaining ${remaining} reading(s) today.`,
    );
  },
};

/**
 * Creates a BullMQ job processor function for the daily reminder job.
 * Allows dependency injection of Prisma and Notifier for unit testing.
 *
 * @param {object} [dependencies]
 * @param {import('@prisma/client').PrismaClient} [dependencies.prisma]
 * @param {typeof defaultNotifier} [dependencies.notifier]
 * @returns {(job: import('bullmq').Job) => Promise<object>}
 */
export function createReminderProcessor({
  prisma = defaultPrisma,
  notifier = defaultNotifier,
} = {}) {
  return async function processDailyReminders(job) {
    const referenceDate = job?.data?.date || todayInTimezone(env.APP_TIMEZONE);
    const dateObj = new Date(referenceDate);

    logger.info({ referenceDate }, 'Executing daily reminder check for patients');

    // 1. Fetch all registered patients
    const patients = await prisma.user.findMany({
      where: { role: ROLES.PATIENT },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    let remindedCount = 0;
    let skippedCount = 0;

    // 2. Count today's readings per patient and notify if fewer than 4 logged
    for (const patient of patients) {
      const readingsCount = await prisma.reading.count({
        where: {
          userId: patient.id,
          readingDate: dateObj,
        },
      });

      if (readingsCount < LIMITS.READINGS_PER_DAY) {
        const remaining = LIMITS.READINGS_PER_DAY - readingsCount;
        await notifier.sendReminder({
          patientId: patient.id,
          name: patient.name,
          email: patient.email,
          count: readingsCount,
          remaining,
          date: referenceDate,
        });
        remindedCount++;
      } else {
        skippedCount++;
      }
    }

    const summary = {
      referenceDate,
      totalPatients: patients.length,
      remindedCount,
      skippedCount,
    };

    logger.info(summary, 'Completed daily reminder check');
    return summary;
  };
}
