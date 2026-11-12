import { prisma as defaultPrisma } from '../../lib/prisma.js';
import { parseDateUtc } from '@sweety/shared/utils/date.js';

/**
 * Repository layer for glucose report queries and aggregations.
 * Uses PostgreSQL database-level aggregations (_count, _avg, _min, _max) for efficiency.
 */
export class ReportRepository {
  /**
   * @param {import('@prisma/client').PrismaClient} [prisma]
   */
  constructor(prisma = defaultPrisma) {
    this.prisma = prisma;
  }

  /**
   * Aggregates readings and retrieves chronological reading records within a calendar date range.
   *
   * @param {string} userId - Target patient ID
   * @param {string} from - Start date YYYY-MM-DD
   * @param {string} to - End date YYYY-MM-DD
   * @returns {Promise<{
   *   stats: { _count: { id: number }, _avg: { value: number | null }, _min: { value: number | null }, _max: { value: number | null } },
   *   readings: object[]
   * }>}
   */
  async getReportData(userId, from, to) {
    const fromDate = parseDateUtc(from);
    const toDate = parseDateUtc(to);

    const where = {
      userId,
      readingDate: {
        gte: fromDate,
        lte: toDate,
      },
    };

    const [stats, readings] = await Promise.all([
      this.prisma.reading.aggregate({
        where,
        _count: { id: true },
        _avg: { value: true },
        _min: { value: true },
        _max: { value: true },
      }),
      this.prisma.reading.findMany({
        where,
        orderBy: [
          { readingDate: 'asc' },
          { createdAt: 'asc' },
        ],
      }),
    ]);

    return { stats, readings };
  }

  /**
   * Checks if a doctor has access to a specific patient.
   *
   * @param {string} doctorId
   * @param {string} patientId
   * @returns {Promise<boolean>}
   */
  async isDoctorLinkedToPatient(doctorId, patientId) {
    const link = await this.prisma.doctorPatient.findUnique({
      where: {
        doctorId_patientId: {
          doctorId,
          patientId,
        },
      },
    });
    return Boolean(link);
  }
}

export const reportRepository = new ReportRepository();
