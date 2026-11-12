import { LIMITS } from '@sweety/shared/constants/limits.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';
import { SLOT_LABELS } from '@sweety/shared/constants/slots.js';
import { isFutureDate } from '@sweety/shared/utils/date.js';
import {
  DailyLimitError,
  ConflictError,
  FutureDateError,
  NotFoundError,
  ForbiddenError,
} from '../../common/errors/httpErrors.js';
import { env } from '../../config/env.js';
import { readingRepository as defaultReadingRepo } from './reading.repository.js';
import { toReadingResponse } from './reading.mapper.js';

/**
 * Service encapsulating business logic, concurrency control, and ownership guards for Readings.
 */
export class ReadingService {
  /**
   * @param {import('./reading.repository.js').ReadingRepository} [readingRepo]
   */
  constructor(readingRepo = defaultReadingRepo) {
    this.readingRepo = readingRepo;
  }

  /**
   * Records a new blood glucose reading with strict clinical and concurrency validation.
   *
   * @param {string} userId - Authenticated patient ID
   * @param {object} payload
   * @param {string} payload.date - Calendar date YYYY-MM-DD
   * @param {string} payload.slot - Slot enum
   * @param {number} payload.value - Glucose value in mg/dl
   * @param {string} [payload.notes] - Clinical notes
   * @returns {Promise<object>} Formatted reading
   */
  async createReading(userId, { date, slot, value, notes }) {
    // 1. Future Date Rejection (clinical rule)
    if (isFutureDate(date, env.APP_TIMEZONE)) {
      throw new FutureDateError(MESSAGES.DATE_FUTURE);
    }

    // 2. Precedence Rule: Daily Limit (4/day) check runs first
    const dailyCount = await this.readingRepo.countByUserAndDate(userId, date);
    if (dailyCount >= LIMITS.READINGS_PER_DAY) {
      throw new DailyLimitError(MESSAGES.DAILY_LIMIT_EXCEEDED);
    }

    // 3. Duplicate Slot Check
    const existingSlot = await this.readingRepo.findByUserDateAndSlot(userId, date, slot);
    if (existingSlot) {
      const slotLabel = SLOT_LABELS[slot] || slot;
      throw new ConflictError(MESSAGES.duplicateSlot(slotLabel));
    }

    // 4. Persistence with race-condition fallback
    try {
      const reading = await this.readingRepo.create({
        userId,
        date,
        slot,
        value,
        notes,
      });
      return toReadingResponse(reading);
    } catch (err) {
      // Handle concurrent insert race condition (P2002 Unique constraint)
      if (err.code === 'P2002') {
        const recheckCount = await this.readingRepo.countByUserAndDate(userId, date);
        if (recheckCount >= LIMITS.READINGS_PER_DAY) {
          throw new DailyLimitError(MESSAGES.DAILY_LIMIT_EXCEEDED);
        }
        const slotLabel = SLOT_LABELS[slot] || slot;
        throw new ConflictError(MESSAGES.duplicateSlot(slotLabel));
      }
      throw err;
    }
  }

  /**
   * Retrieves paginated readings for a user.
   *
   * @param {string} userId
   * @param {object} query
   * @param {number} [query.page=1]
   * @param {number} [query.limit=20]
   * @param {string} [query.from] - YYYY-MM-DD
   * @param {string} [query.to] - YYYY-MM-DD
   * @returns {Promise<{ data: object[], page: number, limit: number, total: number, totalPages: number }>}
   */
  async getReadings(userId, { page = LIMITS.PAGE_DEFAULT, limit = LIMITS.PAGE_LIMIT_DEFAULT, from, to }) {
    const skip = (page - 1) * limit;
    const take = limit;

    const { data, total } = await this.readingRepo.findManyByUser(userId, {
      skip,
      take,
      from,
      to,
    });

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: data.map(toReadingResponse),
      page,
      limit,
      total,
      totalPages,
    };
  }

  /**
   * Updates an existing reading with ownership enforcement.
   *
   * @param {string} userId
   * @param {string} readingId
   * @param {object} payload
   * @returns {Promise<object>}
   */
  async updateReading(userId, readingId, payload) {
    const reading = await this.readingRepo.findById(readingId);
    if (!reading) {
      throw new NotFoundError(MESSAGES.NOT_FOUND);
    }

    // Ownership Enforcement
    if (reading.userId !== userId) {
      throw new ForbiddenError(MESSAGES.AUTH_FORBIDDEN);
    }

    if (payload.date && isFutureDate(payload.date, env.APP_TIMEZONE)) {
      throw new FutureDateError(MESSAGES.DATE_FUTURE);
    }

    const updated = await this.readingRepo.update(readingId, payload);
    return toReadingResponse(updated);
  }

  /**
   * Deletes a reading with ownership enforcement.
   *
   * @param {string} userId
   * @param {string} readingId
   * @returns {Promise<void>}
   */
  async deleteReading(userId, readingId) {
    const reading = await this.readingRepo.findById(readingId);
    if (!reading) {
      throw new NotFoundError(MESSAGES.NOT_FOUND);
    }

    // Ownership Enforcement
    if (reading.userId !== userId) {
      throw new ForbiddenError(MESSAGES.AUTH_FORBIDDEN);
    }

    await this.readingRepo.delete(readingId);
  }
}

export const readingService = new ReadingService();
