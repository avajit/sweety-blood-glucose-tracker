import { getReportDateRange } from '@sweety/shared/utils/date.js';

/**
 * Derives the start and end calendar dates for a specified report type and reference date.
 * - daily: exact reference date
 * - month-to-date: from the 1st of that month through the reference date
 * - monthly: the entire previous calendar month
 *
 * @param {'daily' | 'month-to-date' | 'monthly'} type
 * @param {string} referenceDate - YYYY-MM-DD
 * @returns {{ from: string, to: string }}
 */
export function getRangeForReport(type, referenceDate) {
  return getReportDateRange(type, referenceDate);
}

export { getReportDateRange };
