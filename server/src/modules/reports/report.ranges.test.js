import { describe, it, expect } from 'vitest';
import { getReportDateRange } from './report.ranges.js';

describe('Report Date Ranges Utility', () => {
  describe('daily report type', () => {
    it('returns the exact same date for from and to', () => {
      const range = getReportDateRange('daily', '2026-11-12');
      expect(range).toEqual({
        from: '2026-11-12',
        to: '2026-11-12',
      });
    });
  });

  describe('month-to-date report type', () => {
    it('returns from the 1st of that month through the selected date', () => {
      const range = getReportDateRange('month-to-date', '2026-11-12');
      expect(range).toEqual({
        from: '2026-11-01',
        to: '2026-11-12',
      });
    });

    it('returns single-day range when selected date is the 1st of the month', () => {
      const range = getReportDateRange('month-to-date', '2026-05-01');
      expect(range).toEqual({
        from: '2026-05-01',
        to: '2026-05-01',
      });
    });
  });

  describe('monthly report type (prior calendar month)', () => {
    it('returns the whole January range when selected date is in February', () => {
      const range = getReportDateRange('monthly', '2026-02-15');
      expect(range).toEqual({
        from: '2026-01-01',
        to: '2026-01-31',
      });
    });

    it('returns 28 days for February in a non-leap year (2026)', () => {
      const range = getReportDateRange('monthly', '2026-03-15');
      expect(range).toEqual({
        from: '2026-02-01',
        to: '2026-02-28',
      });
    });

    it('returns 29 days for February in a leap year (2024)', () => {
      const range = getReportDateRange('monthly', '2024-03-15');
      expect(range).toEqual({
        from: '2024-02-01',
        to: '2024-02-29',
      });
    });

    it('handles year rollover: returns December of previous year when selected date is in January', () => {
      const range = getReportDateRange('monthly', '2026-01-10');
      expect(range).toEqual({
        from: '2025-12-01',
        to: '2025-12-31',
      });
    });
  });

  describe('validation errors', () => {
    it('throws error when selected date format is invalid', () => {
      expect(() => getReportDateRange('daily', 'not-a-date')).toThrow('Invalid selected date');
    });

    it('throws error for unsupported report type', () => {
      expect(() => getReportDateRange('quarterly', '2026-11-12')).toThrow('Unsupported report type');
    });
  });
});
