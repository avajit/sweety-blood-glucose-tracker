import { z } from 'zod';
import { MESSAGES } from '../constants/messages.js';
import { isValidDateString, isFutureDate } from '../utils/date.js';

export const REPORT_TYPES = Object.freeze(['daily', 'month-to-date', 'monthly']);

/**
 * Report path parameter schema.
 */
export const reportTypeSchema = z.enum(REPORT_TYPES, {
  errorMap: () => ({ message: MESSAGES.REPORT_TYPE_INVALID }),
});

/**
 * Factory for report query schema taking an optional timezone.
 * When timezone is provided, validates that date is not in the future.
 * @param {string} [timezone]
 */
export function getReportQuerySchema(timezone) {
  return z
    .object({
      date: z
        .string()
        .refine(isValidDateString, { message: MESSAGES.DATE_INVALID })
        .optional(),
      patientId: z.string().uuid().optional(),
    })
    .superRefine((data, ctx) => {
      if (timezone && data.date && isFutureDate(data.date, timezone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['date'],
          message: MESSAGES.DATE_FUTURE,
        });
      }
    });
}

/**
 * Default report query schema without timezone binding.
 */
export const reportQuerySchema = getReportQuerySchema();
