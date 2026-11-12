import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { reportRepository } from '../../src/modules/reports/report.repository.js';
import { issueTestToken, createAuthCookieHeader } from '../helpers/auth.js';

describe('Reports Empty State API', () => {
  const app = createApp();
  const request = supertest(app);
  const testUserId = 'empty-state-patient-uuid';
  let authCookie;

  beforeEach(() => {
    vi.restoreAllMocks();
    const token = issueTestToken({ id: testUserId, role: 'PATIENT' });
    authCookie = createAuthCookieHeader(token);
  });

  it('returns clean empty state when no readings exist for the requested day', async () => {
    vi.spyOn(reportRepository, 'getReportData').mockResolvedValue({
      stats: {
        _count: { id: 0 },
        _min: { value: null },
        _max: { value: null },
        _avg: { value: null },
      },
      readings: [],
    });

    const res = await request
      .get('/api/reports/daily?date=2026-11-10')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      type: 'daily',
      range: {
        from: '2026-11-10',
        to: '2026-11-10',
      },
      count: 0,
      highest: null,
      lowest: null,
      average: null,
      estimatedA1c: null,
      timeInRange: {
        total: 0,
        inRangePct: 0,
        lowPct: 0,
        highPct: 0,
        hypoCount: 0,
        severeHypoCount: 0,
      },
      readings: [],
    });
  });

  it('returns clean empty state for monthly report with zero readings', async () => {
    vi.spyOn(reportRepository, 'getReportData').mockResolvedValue({
      stats: {
        _count: { id: 0 },
        _min: { value: null },
        _max: { value: null },
        _avg: { value: null },
      },
      readings: [],
    });

    const res = await request
      .get('/api/reports/monthly?date=2026-11-10')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.highest).toBeNull();
    expect(res.body.lowest).toBeNull();
    expect(res.body.average).toBeNull();
    expect(res.body.estimatedA1c).toBeNull();
    expect(res.body.readings).toEqual([]);
  });

  it('defaults to today when no date parameter is supplied', async () => {
    const getReportDataSpy = vi.spyOn(reportRepository, 'getReportData').mockResolvedValue({
      stats: {
        _count: { id: 0 },
        _min: { value: null },
        _max: { value: null },
        _avg: { value: null },
      },
      readings: [],
    });

    const res = await request
      .get('/api/reports/daily')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(getReportDataSpy).toHaveBeenCalled();
  });
});
