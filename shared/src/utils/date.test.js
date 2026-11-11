import { describe, it, expect } from 'vitest';
import {
  isValidDateString,
  todayInTimezone,
  isFutureDate,
  parseDateUtc,
  formatDateUtc,
  getReportDateRange,
} from './date.js';

describe('date.js utilities', () => {
  describe('isValidDateString', () => {
    it('accepts valid YYYY-MM-DD date strings', () => {
      expect(isValidDateString('2026-11-10')).toBe(true);
      expect(isValidDateString('2024-02-29')).toBe(true); // Leap year
    });

    it('rejects invalid calendar dates', () => {
      expect(isValidDateString('2025-02-29')).toBe(false); // Non-leap year
      expect(isValidDateString('2026-04-31')).toBe(false); // April has 30 days
      expect(isValidDateString('2026-13-01')).toBe(false); // Invalid month
      expect(isValidDateString('2026-00-10')).toBe(false);
      expect(isValidDateString('not-a-date')).toBe(false);
      expect(isValidDateString('')).toBe(false);
      expect(isValidDateString(null)).toBe(false);
      expect(isValidDateString(undefined)).toBe(false);
    });
  });

  describe('todayInTimezone', () => {
    it('returns a valid YYYY-MM-DD date string for given timezone', () => {
      const todayKolkata = todayInTimezone('Asia/Kolkata');
      expect(isValidDateString(todayKolkata)).toBe(true);
    });
  });

  describe('isFutureDate', () => {
    it('correctly detects past, current, and future dates', () => {
      const today = todayInTimezone('Asia/Kolkata');
      expect(isFutureDate('2000-01-01', 'Asia/Kolkata')).toBe(false);
      expect(isFutureDate(today, 'Asia/Kolkata')).toBe(false);
      expect(isFutureDate('2099-12-31', 'Asia/Kolkata')).toBe(true);
    });
  });

  describe('parseDateUtc and formatDateUtc', () => {
    it('correctly parses and formats UTC date at midnight', () => {
      const dateStr = '2026-05-18';
      const parsed = parseDateUtc(dateStr);
      expect(parsed.toISOString()).toBe('2026-05-18T00:00:00.000Z');
      expect(formatDateUtc(parsed)).toBe(dateStr);
    });

    it('throws error when parsing invalid date string', () => {
      expect(() => parseDateUtc('invalid')).toThrow('Invalid date string');
    });
  });

  describe('getReportDateRange (Must-have range specifications)', () => {
    it('daily: returns exact selected date for from and to', () => {
      const range = getReportDateRange('daily', '2026-10-15');
      expect(range).toEqual({ from: '2026-10-15', to: '2026-10-15' });
    });

    it('month-to-date: returns 1st of month to selected date', () => {
      const range = getReportDateRange('month-to-date', '2026-10-15');
      expect(range).toEqual({ from: '2026-10-01', to: '2026-10-15' });
    });

    it('month-to-date: on 1st of month returns single day range', () => {
      const range = getReportDateRange('month-to-date', '2026-05-01');
      expect(range).toEqual({ from: '2026-05-01', to: '2026-05-01' });
    });

    it('monthly: 15 Jan -> whole previous month is Dec of previous year', () => {
      const range = getReportDateRange('monthly', '2026-01-15');
      expect(range).toEqual({ from: '2025-12-01', to: '2025-12-31' });
    });

    it('monthly: 1 Mar in leap year (2024) -> Feb ends on 29th', () => {
      const range = getReportDateRange('monthly', '2024-03-01');
      expect(range).toEqual({ from: '2024-02-01', to: '2024-02-29' });
    });

    it('monthly: 1 Mar in non-leap year (2025) -> Feb ends on 28th', () => {
      const range = getReportDateRange('monthly', '2025-03-01');
      expect(range).toEqual({ from: '2025-02-01', to: '2025-02-28' });
    });

    it('monthly: standard mid-year month transition', () => {
      const range = getReportDateRange('monthly', '2026-10-15');
      expect(range).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    });

    it('throws for unsupported report type', () => {
      expect(() => getReportDateRange('yearly', '2026-10-15')).toThrow('Unsupported report type');
    });
  });
});
