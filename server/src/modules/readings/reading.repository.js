import { prisma as defaultPrisma } from '../../lib/prisma.js';
import { parseDateUtc } from '@sweety/shared/utils/date.js';

/**
 * Repository layer for the Reading entity.
 * Directly executes Prisma queries against PostgreSQL.
 */
export class ReadingRepository {
  /**
   * @param {import('@prisma/client').PrismaClient} [prisma]
   */
  constructor(prisma = defaultPrisma) {
    this.prisma = prisma;
  }

  /**
   * Counts how many readings a user has recorded on a specific date.
   * @param {string} userId
   * @param {string} dateString - YYYY-MM-DD
   * @returns {Promise<number>}
   */
  async countByUserAndDate(userId, dateString) {
    const targetDate = parseDateUtc(dateString);
    return this.prisma.reading.count({
      where: {
        userId,
        readingDate: targetDate,
      },
    });
  }

  /**
   * Finds a reading by user, calendar date, and meal slot.
   * @param {string} userId
   * @param {string} dateString - YYYY-MM-DD
   * @param {string} slot - Slot enum value
   * @returns {Promise<object | null>}
   */
  async findByUserDateAndSlot(userId, dateString, slot) {
    const targetDate = parseDateUtc(dateString);
    return this.prisma.reading.findUnique({
      where: {
        userId_readingDate_slot: {
          userId,
          readingDate: targetDate,
          slot,
        },
      },
    });
  }

  /**
   * Finds a reading by its unique primary ID.
   * @param {string} id
   * @returns {Promise<object | null>}
   */
  async findById(id) {
    return this.prisma.reading.findUnique({
      where: { id },
    });
  }

  /**
   * Creates a new reading in the database.
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.date - YYYY-MM-DD
   * @param {string} params.slot
   * @param {number} params.value
   * @param {string} [params.notes]
   * @returns {Promise<object>}
   */
  async create({ userId, date, slot, value, notes }) {
    const readingDate = parseDateUtc(date);
    return this.prisma.reading.create({
      data: {
        userId,
        readingDate,
        slot,
        value,
        notes: notes || null,
      },
    });
  }

  /**
   * Retrieves paginated readings for a user with optional date range filters.
   *
   * @param {string} userId
   * @param {object} opts
   * @param {number} opts.skip
   * @param {number} opts.take
   * @param {string} [opts.from] - YYYY-MM-DD
   * @param {string} [opts.to] - YYYY-MM-DD
   * @returns {Promise<{ data: object[], total: number }>}
   */
  async findManyByUser(userId, { skip, take, from, to }) {
    const dateFilter = {};
    if (from) {
      dateFilter.gte = parseDateUtc(from);
    }
    if (to) {
      dateFilter.lte = parseDateUtc(to);
    }

    const where = {
      userId,
      ...(from || to ? { readingDate: dateFilter } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.reading.findMany({
        where,
        skip,
        take,
        orderBy: [{ readingDate: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.reading.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Updates an existing reading.
   * @param {string} id
   * @param {object} data
   * @returns {Promise<object>}
   */
  async update(id, data) {
    const updateData = { ...data };
    if (updateData.date) {
      updateData.readingDate = parseDateUtc(updateData.date);
      delete updateData.date;
    }

    return this.prisma.reading.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Deletes a reading by its ID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async delete(id) {
    return this.prisma.reading.delete({
      where: { id },
    });
  }
}

export const readingRepository = new ReadingRepository();
