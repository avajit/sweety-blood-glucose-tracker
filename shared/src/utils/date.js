import { LIMITS } from '../constants/limits.js';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates if a string is a valid YYYY-MM-DD calendar date.
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string' || !DATE_REGEX.test(dateStr)) {
    return false;
  }

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  // Construct UTC date to verify real calendar existence (e.g. Feb 30)
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

/**
 * Returns today's date formatted as YYYY-MM-DD in the specified timezone.
 * Pure function: takes timezone as parameter (defaults to DEFAULT_APP_TIMEZONE).
 * @param {string} [timezone=LIMITS.DEFAULT_APP_TIMEZONE]
 * @returns {string}
 */
export function todayInTimezone(timezone = LIMITS.DEFAULT_APP_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Checks if a given date string is in the future relative to the timezone's "today".
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string} [timezone=LIMITS.DEFAULT_APP_TIMEZONE]
 * @returns {boolean}
 */
export function isFutureDate(dateStr, timezone = LIMITS.DEFAULT_APP_TIMEZONE) {
  if (!isValidDateString(dateStr)) {
    return false;
  }
  const today = todayInTimezone(timezone);
  return dateStr > today;
}

/**
 * Converts a YYYY-MM-DD string to a Date object at UTC midnight.
 * Used exclusively at the repository/database boundary.
 * @param {string} dateStr
 * @returns {Date}
 */
export function parseDateUtc(dateStr) {
  if (!isValidDateString(dateStr)) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Formats a Date object to YYYY-MM-DD using UTC date components.
 * @param {Date} date
 * @returns {string}
 */
export function formatDateUtc(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates start and end dates for a report type relative to a selected date.
 * - daily: the selected date.
 * - month-to-date: from the 1st of that month through the selected date.
 * - monthly: the entire calendar month prior to the selected date's month.
 *
 * @param {'daily' | 'month-to-date' | 'monthly'} type
 * @param {string} selectedDateStr - YYYY-MM-DD
 * @returns {{ from: string, to: string }}
 */
export function getReportDateRange(type, selectedDateStr) {
  if (!isValidDateString(selectedDateStr)) {
    throw new Error(`Invalid selected date: ${selectedDateStr}`);
  }

  const [yearStr, monthStr] = selectedDateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  if (type === 'daily') {
    return { from: selectedDateStr, to: selectedDateStr };
  }

  if (type === 'month-to-date') {
    const from = `${yearStr}-${monthStr}-01`;
    return { from, to: selectedDateStr };
  }

  if (type === 'monthly') {
    // The whole previous month
    // If current is January (1), previous is December of prior year
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevMonthStr = String(prevMonth).padStart(2, '0');
    const from = `${prevYear}-${prevMonthStr}-01`;

    // Last day of previous month: Day 0 of next month in UTC
    const lastDayDate = new Date(Date.UTC(prevYear, prevMonth, 0));
    const to = formatDateUtc(lastDayDate);

    return { from, to };
  }

  throw new Error(`Unsupported report type: ${type}`);
}
