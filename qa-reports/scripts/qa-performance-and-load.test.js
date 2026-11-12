import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../server/src/app.js';
import { readingRepository } from '../../server/src/modules/readings/reading.repository.js';
import { cacheService } from '../../server/src/modules/cache/cache.service.js';
import { issueTestToken, createAuthCookieHeader } from '../../server/tests/helpers/auth.js';

describe('QA Phase 9: Performance, Latency & Concurrency Stress Test Suite', () => {
  const app = createApp();
  const request = supertest(app);
  const testUserId = 'a0000000-0000-0000-0000-000000000099';
  let authCookie;

  beforeEach(() => {
    vi.restoreAllMocks();
    authCookie = createAuthCookieHeader(issueTestToken({ id: testUserId, role: 'PATIENT' }));
  });

  describe('API Response Latency Profiling', () => {
    it('TC-PERF-01: Health check endpoint (/api/health) responds in <= 50ms', async () => {
      const start = performance.now();
      const res = await request.get('/api/health');
      const duration = performance.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(50);
      expect(res.body.status).toBe('ok');
    });

    it('TC-PERF-02: Reading query endpoint responds in <= 100ms with 120 items', async () => {
      vi.spyOn(readingRepository, 'findManyByUser').mockResolvedValue({
        data: Array.from({ length: 120 }, (_, i) => ({
          id: `reading-${i}`,
          userId: testUserId,
          readingDate: new Date('2026-11-01'),
          slot: 'MORNING_FASTING',
          value: 110,
          carbsGrams: 45,
          insulinUnits: 4,
          notes: 'Standard log',
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        total: 120,
      });

      const start = performance.now();
      const res = await request
        .get('/api/readings?from=2026-11-01&to=2026-11-30')
        .set('Cookie', [authCookie]);
      const duration = performance.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(100);
      expect(res.body.data.length).toBe(120);
    });
  });

  describe('Cache Acceleration Latency Comparison', () => {
    it('TC-PERF-03: Cache hit executes in <= 25ms', async () => {
      const mockReport = {
        type: 'monthly',
        range: { from: '2026-10-01', to: '2026-10-31' },
        count: 120,
        average: 125,
        highest: 180,
        lowest: 85,
        timeInRange: { inRangePct: 88, lowPct: 4, highPct: 8 },
        readings: [],
      };

      // Mock cache hit
      vi.spyOn(cacheService, 'get').mockResolvedValue(mockReport);

      const start = performance.now();
      const res = await request
        .get('/api/reports/monthly?date=2026-11-12')
        .set('Cookie', [authCookie]);
      const duration = performance.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(25);
      expect(res.body.count).toBe(120);
    });
  });

  describe('Concurrency & Race Condition Handling', () => {
    it('TC-PERF-04: Multiple simultaneous reading posts for the same slot: only 1 succeeds, others rejected with 409', async () => {
      let slotOccupied = false;
      vi.spyOn(readingRepository, 'countByUserAndDate').mockResolvedValue(1);
      vi.spyOn(readingRepository, 'findByUserDateAndSlot').mockImplementation(async () => {
        return slotOccupied ? { id: 'first-saved' } : null;
      });
      vi.spyOn(readingRepository, 'create').mockImplementation(async (d) => {
        slotOccupied = true;
        return {
          id: 'r-race-winner',
          ...d,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      // Fire 5 concurrent requests
      const promises = Array.from({ length: 5 }, () =>
        request
          .post('/api/readings')
          .set('Cookie', [authCookie])
          .send({
            date: '2026-11-12',
            slot: 'MORNING_FASTING',
            value: 110,
          })
      );

      const results = await Promise.all(promises);
      const statuses = results.map((r) => r.status);
      const successCount = statuses.filter((s) => s === 201).length;
      const conflictCount = statuses.filter((s) => s === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(4);
    });
  });
});
