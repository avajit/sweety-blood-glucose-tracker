import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { reportRepository } from '../../src/modules/reports/report.repository.js';
import { readingRepository } from '../../src/modules/readings/reading.repository.js';
import { setRedisClient } from '../../src/lib/redis.js';
import { issueTestToken, createAuthCookieHeader } from '../helpers/auth.js';
import { createMockReading } from '../factories/reading.factory.js';

/**
 * In-memory Redis mock replicating ioredis interface for cache testing.
 */
class InMemoryRedisMock {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, val) {
    this.store.set(key, val);
    return 'OK';
  }

  async del(...keys) {
    let count = 0;
    for (const k of keys) {
      if (this.store.delete(k)) count++;
    }
    return count;
  }

  async keys(pattern) {
    const prefix = pattern.replace('*', '');
    const matched = [];
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) {
        matched.push(k);
      }
    }
    return matched;
  }
}

describe('Module 11 — Reports Redis Cache Integration API', () => {
  const app = createApp();
  const request = supertest(app);
  const testUserId = 'test-patient-uuid';
  let authCookie;

  beforeEach(() => {
    vi.restoreAllMocks();
    const token = issueTestToken({ id: testUserId, role: 'PATIENT' });
    authCookie = createAuthCookieHeader(token);
  });

  afterEach(() => {
    // Restore null client after tests
    setRedisClient(null);
  });

  it('when REDIS_URL is not set (null client), report endpoints still return correct data', async () => {
    setRedisClient(null);

    const mockReadings = [
      createMockReading({ id: 'r1', value: 105, slot: 'MORNING_FASTING', date: '2026-11-10' }),
    ];

    const getReportDataSpy = vi.spyOn(reportRepository, 'getReportData').mockResolvedValue({
      stats: {
        _count: { id: 1 },
        _min: { value: 105 },
        _max: { value: 105 },
        _avg: { value: 105 },
      },
      readings: mockReadings,
    });

    const res = await request
      .get('/api/reports/daily?date=2026-11-10')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('daily');
    expect(res.body.count).toBe(1);
    expect(res.body.average).toBe(105);
    expect(getReportDataSpy).toHaveBeenCalledTimes(1);
  });

  it('when Redis is available, a second identical report request hits cache', async () => {
    const redisMock = new InMemoryRedisMock();
    setRedisClient(redisMock);

    const mockReadings = [
      createMockReading({ id: 'r1', value: 110, slot: 'MORNING_FASTING', date: '2026-11-10' }),
    ];

    const getReportDataSpy = vi.spyOn(reportRepository, 'getReportData').mockResolvedValue({
      stats: {
        _count: { id: 1 },
        _min: { value: 110 },
        _max: { value: 110 },
        _avg: { value: 110 },
      },
      readings: mockReadings,
    });

    // First request: Cache miss -> queries DB and populates cache
    const res1 = await request
      .get('/api/reports/daily?date=2026-11-10')
      .set('Cookie', [authCookie]);

    expect(res1.status).toBe(200);
    expect(res1.body.count).toBe(1);
    expect(getReportDataSpy).toHaveBeenCalledTimes(1);

    // Verify key in cache
    const cachedData = await redisMock.get(`report:${testUserId}:daily:2026-11-10`);
    expect(cachedData).not.toBeNull();

    // Second request: Cache hit -> returns cached data without calling database repository
    const res2 = await request
      .get('/api/reports/daily?date=2026-11-10')
      .set('Cookie', [authCookie]);

    expect(res2.status).toBe(200);
    expect(res2.body.count).toBe(1);
    expect(res2.body.average).toBe(110);
    // Repository spy MUST NOT be called a second time
    expect(getReportDataSpy).toHaveBeenCalledTimes(1);
  });

  it('cache is invalidated after POST /api/readings', async () => {
    const redisMock = new InMemoryRedisMock();
    setRedisClient(redisMock);

    const mockReadings = [
      createMockReading({ id: 'r1', value: 120, slot: 'MORNING_FASTING', date: '2026-11-10' }),
    ];

    const getReportDataSpy = vi.spyOn(reportRepository, 'getReportData').mockResolvedValue({
      stats: {
        _count: { id: 1 },
        _min: { value: 120 },
        _max: { value: 120 },
        _avg: { value: 120 },
      },
      readings: mockReadings,
    });

    // 1. Initial request caches the report
    await request
      .get('/api/reports/daily?date=2026-11-10')
      .set('Cookie', [authCookie]);

    expect(getReportDataSpy).toHaveBeenCalledTimes(1);
    expect(await redisMock.get(`report:${testUserId}:daily:2026-11-10`)).not.toBeNull();

    // 2. Mock reading creation dependencies
    vi.spyOn(readingRepository, 'countByUserAndDate').mockResolvedValue(1);
    vi.spyOn(readingRepository, 'findByUserDateAndSlot').mockResolvedValue(null);
    vi.spyOn(readingRepository, 'create').mockResolvedValue({
      id: 'r2',
      userId: testUserId,
      readingDate: new Date('2026-11-10'),
      slot: 'AFTER_BREAKFAST',
      value: 145,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 3. User creates a new reading
    const postRes = await request
      .post('/api/readings')
      .set('Cookie', [authCookie])
      .send({
        value: 145,
        slot: 'AFTER_BREAKFAST',
        date: '2026-11-10',
      });

    expect(postRes.status).toBe(201);

    // 4. Cache must now be invalidated
    const cachedAfterInvalidate = await redisMock.get(`report:${testUserId}:daily:2026-11-10`);
    expect(cachedAfterInvalidate).toBeNull();

    // 5. Subsequent report request must query database repository again
    await request
      .get('/api/reports/daily?date=2026-11-10')
      .set('Cookie', [authCookie]);

    expect(getReportDataSpy).toHaveBeenCalledTimes(2);
  });
});
