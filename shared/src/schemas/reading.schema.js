import { z } from 'zod';
import { MESSAGES } from '../constants/messages.js';
import { LIMITS } from '../constants/limits.js';
import { SLOT_VALUES } from '../constants/slots.js';
import { isValidDateString, isFutureDate } from '../utils/date.js';

/**
 * Preprocessor to ensure empty strings or NaN are transformed to undefined
 * so that z.number required_error triggers properly.
 * @param {unknown} val
 * @returns {unknown}
 */
const preprocessGlucoseValue = (val) => {
  if (val === '' || val === null || val === undefined) {
    return undefined;
  }
  if (typeof val === 'number') {
    return Number.isNaN(val) ? undefined : val;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return undefined;
    const num = Number(trimmed);
    return Number.isNaN(num) ? val : num;
  }
  return val;
};

/**
 * Zod schema for glucose value:
 * Integer between 40 and 600 mg/dl.
 */
export const glucoseValueSchema = z.preprocess(
  preprocessGlucoseValue,
  z
    .number({
      required_error: MESSAGES.VALUE_REQUIRED,
      invalid_type_error: MESSAGES.VALUE_REQUIRED,
    })
    .int(MESSAGES.VALUE_RANGE)
    .min(LIMITS.VALUE_MIN, MESSAGES.VALUE_RANGE)
    .max(LIMITS.VALUE_MAX, MESSAGES.VALUE_RANGE),
);

/**
 * Zod schema for reading date string:
 * Must be a valid YYYY-MM-DD calendar date.
 */
export const readingDateStringSchema = z
  .string({ required_error: MESSAGES.DATE_REQUIRED })
  .regex(/^\d{4}-\d{2}-\d{2}$/, MESSAGES.DATE_INVALID)
  .refine(isValidDateString, { message: MESSAGES.DATE_INVALID });

/**
 * Zod schema for slot selection.
 */
export const slotSchema = z.enum(SLOT_VALUES, {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_type && ctx.data === undefined) {
      return { message: MESSAGES.SLOT_REQUIRED };
    }
    return { message: MESSAGES.SLOT_INVALID };
  },
});

/**
 * Factory for create reading schema taking an optional timezone.
 * When timezone is provided, validates that date is not in the future.
 * @param {string} [timezone]
 */
export function getCreateReadingSchema(timezone) {
  return z
    .object({
      date: readingDateStringSchema,
      slot: slotSchema,
      value: glucoseValueSchema,
    })
    .superRefine((data, ctx) => {
      if (timezone && isFutureDate(data.date, timezone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['date'],
          message: MESSAGES.DATE_FUTURE,
        });
      }
    });
}

/**
 * Default create reading schema (without timezone binding).
 */
export const createReadingSchema = getCreateReadingSchema();

/**
 * Factory for update reading schema taking an optional timezone.
 * Requires at least one field: value, slot, or date.
 * @param {string} [timezone]
 */
export function getUpdateReadingSchema(timezone) {
  return z
    .object({
      date: readingDateStringSchema.optional(),
      slot: slotSchema.optional(),
      value: glucoseValueSchema.optional(),
    })
    .superRefine((data, ctx) => {
      if (
        data.date === undefined &&
        data.slot === undefined &&
        data.value === undefined
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one field (date, slot, or value) must be provided for update.',
        });
      }
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
 * Default update reading schema.
 */
export const updateReadingSchema = getUpdateReadingSchema();
