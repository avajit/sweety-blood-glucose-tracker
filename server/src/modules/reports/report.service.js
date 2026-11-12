import { MESSAGES } from '@sweety/shared/constants/messages.js';
import { ROLES } from '@sweety/shared/constants/roles.js';
import { isFutureDate, todayInTimezone, getReportDateRange } from '@sweety/shared/utils/date.js';
import { FutureDateError, ForbiddenError } from '../../common/errors/httpErrors.js';
import { env } from '../../config/env.js';
import { reportRepository as defaultReportRepo } from './report.repository.js';
import { toReportResponse } from './report.mapper.js';
import { cacheService as defaultCacheService } from '../cache/cache.service.js';

/**
 * Service orchestrating glucose reports calculation, clinical access rules, and aggregations.
 */
export class ReportService {
  /**
   * @param {import('./report.repository.js').ReportRepository} [reportRepo]
   * @param {import('../cache/cache.service.js').CacheService} [cacheService]
   */
  constructor(reportRepo = defaultReportRepo, cacheService = defaultCacheService) {
    this.reportRepo = reportRepo;
    this.cacheService = cacheService;
  }

  /**
   * Generates a clinical glucose report for the specified type and date.
   * Checks Redis cache prior to database execution; caches result on miss.
   *
   * @param {object} requestingUser - Authenticated user context (req.user)
   * @param {string} requestingUser.id
   * @param {string} requestingUser.role
   * @param {'daily' | 'month-to-date' | 'monthly'} type
   * @param {object} query
   * @param {string} [query.date] - YYYY-MM-DD reference date
   * @param {string} [query.patientId] - Target patient UUID (doctors only)
   * @returns {Promise<object>} Standardized report payload
   */
  async getReport(requestingUser, type, { date, patientId } = {}) {
    const referenceDate = date || todayInTimezone(env.APP_TIMEZONE);

    // 1. Future Date Rejection
    if (isFutureDate(referenceDate, env.APP_TIMEZONE)) {
      throw new FutureDateError(MESSAGES.DATE_FUTURE);
    }

    // 2. Resolve target patient & enforce access control policy
    let targetUserId = requestingUser.id;

    if (requestingUser.role === ROLES.DOCTOR) {
      if (patientId) {
        const isLinked = await this.reportRepo.isDoctorLinkedToPatient(requestingUser.id, patientId);
        if (!isLinked) {
          throw new ForbiddenError(MESSAGES.AUTH_FORBIDDEN);
        }
        targetUserId = patientId;
      }
    } else {
      // Patients cannot access another user's report
      if (patientId && patientId !== requestingUser.id) {
        throw new ForbiddenError(MESSAGES.AUTH_FORBIDDEN);
      }
    }

    // 3. Cache layer check: report:{userId}:{type}:{date}
    const cacheKey = `report:${targetUserId}:${type}:${referenceDate}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 4. Calculate Date Range
    const range = getReportDateRange(type, referenceDate);

    // 5. Query PostgreSQL database aggregations and readings
    const { stats, readings } = await this.reportRepo.getReportData(targetUserId, range.from, range.to);

    const count = stats._count?.id || 0;
    const highest = count > 0 && stats._max?.value !== null ? stats._max.value : null;
    const lowest = count > 0 && stats._min?.value !== null ? stats._min.value : null;
    const average = count > 0 && stats._avg?.value !== null ? Math.round(stats._avg.value) : null;

    // 6. Format standardized clinical response
    const response = toReportResponse({
      type,
      range,
      count,
      highest,
      lowest,
      average,
      readings,
    });

    // 7. Store in cache (60s TTL)
    await this.cacheService.set(cacheKey, response, 60);

    return response;
  }
}

export const reportService = new ReportService();
