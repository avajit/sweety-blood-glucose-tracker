import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { readingRepository } from '../../src/modules/readings/reading.repository.js';
import { issueTestToken, createAuthCookieHeader } from '../helpers/auth.js';
import { createMockReading } from '../factories/reading.factory.js';

describe('Readings Pagination API', () => {
  const app = createApp();
  const request = supertest(app);
  const testUserId = 'pagination-patient-uuid';
  let authCookie;

  beforeEach(() => {
    vi.restoreAllMocks();
    const token = issueTestToken({ id: testUserId, role: 'PATIENT' });
    authCookie = createAuthCookieHeader(token);
  });

  it('second page returns correct data slice and calculates totalPages = Math.ceil(total / limit)', async () => {
    const total = 45;
    const limit = 20;
    const page = 2;

    const page2Readings = Array.from({ length: 20 }, (_, i) =>
      createMockReading({
        id: `reading-p2-${i + 1}`,
        userId: testUserId,
        value: 100 + i,
      }),
    );

    const findManySpy = vi.spyOn(readingRepository, 'findManyByUser').mockResolvedValue({
      data: page2Readings,
      total,
    });

    const res = await request
      .get(`/api/readings?page=${page}&limit=${limit}`)
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(20);
    expect(res.body.total).toBe(45);
    expect(res.body.totalPages).toBe(3); // Math.ceil(45 / 20) = 3
    expect(res.body.data.length).toBe(20);
    expect(res.body.data[0].id).toBe('reading-p2-1');

    // Verify repository called with skip = (2 - 1) * 20 = 20, take = 20
    expect(findManySpy).toHaveBeenCalledWith(testUserId, {
      skip: 20,
      take: 20,
      from: undefined,
      to: undefined,
    });
  });

  it('requesting page beyond totalPages returns empty data array without error', async () => {
    const total = 10;
    const page = 5;
    const limit = 10;

    vi.spyOn(readingRepository, 'findManyByUser').mockResolvedValue({
      data: [],
      total,
    });

    const res = await request
      .get(`/api/readings?page=${page}&limit=${limit}`)
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [],
      total: 10,
      totalPages: 1, // Math.ceil(10 / 10) = 1
      page: 5,
      limit: 10,
    });
  });

  it('empty-state returns { data: [], total: 0, totalPages: 0, page: 1, limit: 20 }', async () => {
    vi.spyOn(readingRepository, 'findManyByUser').mockResolvedValue({
      data: [],
      total: 0,
    });

    const res = await request
      .get('/api/readings')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      limit: 20,
    });
  });

  it('filters by date range with from and to query parameters', async () => {
    const findManySpy = vi.spyOn(readingRepository, 'findManyByUser').mockResolvedValue({
      data: [createMockReading({ userId: testUserId, date: '2026-11-05' })],
      total: 1,
    });

    const res = await request
      .get('/api/readings?from=2026-11-01&to=2026-11-10')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(findManySpy).toHaveBeenCalledWith(testUserId, {
      skip: 0,
      take: 20,
      from: '2026-11-01',
      to: '2026-11-10',
    });
  });
});
