import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { reportRepository } from '../../src/modules/reports/report.repository.js';
import { issueTestToken, createAuthCookieHeader } from '../helpers/auth.js';
import { createMockReading } from '../factories/reading.factory.js';
import { ERROR_CODES } from '@sweety/shared/constants/errorCodes.js';

describe('Reports Ranges & Types API', () => {
  const app = createApp();
  const request = supertest(app);
  const testUserId = 'test-patient-uuid';
  let authCookie;

  beforeEach(() => {
    vi.restoreAllMocks();
    const token = issueTestToken({ id: testUserId, role: 'PATIENT' });
    authCookie = createAuthCookieHeader(token);
  });

  describe('GET /api/reports/daily', () => {
    it('returns 200 OK with daily metrics for the requested date', async () => {
      const mockReadings = [
        createMockReading({ id: 'r1', value: 92, slot: 'MORNING_FASTING', date: '2026-11-10' }),
        createMockReading({ id: 'r2', value: 145, slot: 'AFTER_BREAKFAST', date: '2026-11-10' }),
      ];

      const getReportDataSpy = vi.spyOn(reportRepository, 'getReportData').mockResolvedValue({
        stats: {
          _count: { id: 2 },
          _min: { value: 92 },
          _max: { value: 145 },
          _avg: { value: 118.5 },
        },
        readings: mockReadings,
      });

      const res = await request
        .get('/api/reports/daily?date=2026-11-10')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('daily');
      expect(res.body.range).toEqual({ from: '2026-11-10', to: '2026-11-10' });
      expect(res.body.count).toBe(2);
      expect(res.body.highest).toBe(145);
      expect(res.body.lowest).toBe(92);
      expect(res.body.average).toBe(119); // Math.round(118.5) = 119
      expect(res.body.readings.length).toBe(2);
      expect(getReportDataSpy).toHaveBeenCalledWith(testUserId, '2026-11-10', '2026-11-10');
    });

    it('rejects future reference date with 422 FUTURE_DATE', async () => {
      const res = await request
        .get('/api/reports/daily?date=2099-01-01')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe(ERROR_CODES.FUTURE_DATE);
    });

    it('returns 401 UNAUTHORIZED when no auth cookie is provided', async () => {
      const res = await request.get('/api/reports/daily?date=2026-11-10');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/reports/month-to-date', () => {
    it('returns month-to-date range starting on the 1st of the month', async () => {
      const getReportDataSpy = vi.spyOn(reportRepository, 'getReportData').mockResolvedValue({
        stats: {
          _count: { id: 10 },
          _min: { value: 80 },
          _max: { value: 175 },
          _avg: { value: 120 },
        },
        readings: [],
      });

      const res = await request
        .get('/api/reports/month-to-date?date=2026-11-10')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('month-to-date');
      expect(res.body.range).toEqual({ from: '2026-11-01', to: '2026-11-10' });
      expect(getReportDataSpy).toHaveBeenCalledWith(testUserId, '2026-11-01', '2026-11-10');
    });
  });

  describe('GET /api/reports/monthly', () => {
    it('returns entire previous calendar month range', async () => {
      const getReportDataSpy = vi.spyOn(reportRepository, 'getReportData').mockResolvedValue({
        stats: {
          _count: { id: 60 },
          _min: { value: 75 },
          _max: { value: 190 },
          _avg: { value: 125 },
        },
        readings: [],
      });

      const res = await request
        .get('/api/reports/monthly?date=2026-03-15')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('monthly');
      // Previous month is February 2026 (non-leap year, 28 days)
      expect(res.body.range).toEqual({ from: '2026-02-01', to: '2026-02-28' });
      expect(getReportDataSpy).toHaveBeenCalledWith(testUserId, '2026-02-01', '2026-02-28');
    });
  });

  describe('type parameter validation', () => {
    it('returns 400 VALIDATION_ERROR when an invalid report type is requested', async () => {
      const res = await request
        .get('/api/reports/yearly?date=2026-11-10')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });
});
