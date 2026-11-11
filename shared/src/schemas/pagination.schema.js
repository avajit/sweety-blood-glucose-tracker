import { z } from 'zod';
import { LIMITS } from '../constants/limits.js';
import { isValidDateString } from '../utils/date.js';
import { MESSAGES } from '../constants/messages.js';

/**
 * Preprocesses query string parameters into integers.
 * @param {unknown} val
 * @param {number} fallback
 * @returns {number}
 */
const preprocessInt = (val, fallback) => {
  if (val === undefined || val === null || val === '') {
    return fallback;
  }
  const parsed = parseInt(String(val), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

/**
 * Query parameters schema for paginated readings endpoint:
 * GET /api/readings?page=1&limit=20&from=2026-10-01&to=2026-10-15
 */
export const paginationQuerySchema = z.object({
  page: z.preprocess(
    (val) => preprocessInt(val, LIMITS.PAGE_DEFAULT),
    z.number().int().min(1).default(LIMITS.PAGE_DEFAULT),
  ),
  limit: z.preprocess(
    (val) => preprocessInt(val, LIMITS.PAGE_LIMIT_DEFAULT),
    z.number().int().min(1).max(LIMITS.PAGE_LIMIT_MAX).default(LIMITS.PAGE_LIMIT_DEFAULT),
  ),
  from: z
    .string()
    .refine(isValidDateString, { message: MESSAGES.DATE_INVALID })
    .optional(),
  to: z
    .string()
    .refine(isValidDateString, { message: MESSAGES.DATE_INVALID })
    .optional(),
});
