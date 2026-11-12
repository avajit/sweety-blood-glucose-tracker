import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { readingRepository } from '../../src/modules/readings/reading.repository.js';
import { issueTestToken, createAuthCookieHeader } from '../helpers/auth.js';
import { createMockReading } from '../factories/reading.factory.js';

describe('Readings CRUD API', () => {
  const app = createApp();
  const request = supertest(app);
  const testUserId = 'test-patient-uuid';
  let authCookie;

  beforeEach(() => {
    vi.restoreAllMocks();
    const token = issueTestToken({ id: testUserId, role: 'PATIENT' });
    authCookie = createAuthCookieHeader(token);
  });

  describe('POST /api/readings', () => {
    it('creates a new reading and returns 201 Created with mapped payload', async () => {
      vi.spyOn(readingRepository, 'countByUserAndDate').mockResolvedValue(1);
      vi.spyOn(readingRepository, 'findByUserDateAndSlot').mockResolvedValue(null);
      const mockRecord = createMockReading({
        id: 'r-created-1',
        userId: testUserId,
        date: '2026-11-10',
        slot: 'MORNING_FASTING',
        value: 105,
        notes: 'Good sleep',
      });
      vi.spyOn(readingRepository, 'create').mockResolvedValue(mockRecord);

      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-10',
          slot: 'MORNING_FASTING',
          value: 105,
          notes: 'Good sleep',
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: 'r-created-1',
        userId: testUserId,
        readingDate: '2026-11-10',
        slot: 'MORNING_FASTING',
        value: 105,
        notes: 'Good sleep',
        carbsGrams: null,
        insulinUnits: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('creates a reading with clinical correlates (carbs and insulin) and returns 201 Created', async () => {
      vi.spyOn(readingRepository, 'countByUserAndDate').mockResolvedValue(0);
      vi.spyOn(readingRepository, 'findByUserDateAndSlot').mockResolvedValue(null);
      const mockRecord = createMockReading({
        id: 'r-correlates-1',
        userId: testUserId,
        date: '2026-11-10',
        slot: 'AFTER_LUNCH',
        value: 140,
        notes: 'Pasta lunch',
        carbsGrams: 65,
        insulinUnits: 6.0,
      });
      vi.spyOn(readingRepository, 'create').mockResolvedValue(mockRecord);

      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-10',
          slot: 'AFTER_LUNCH',
          value: 140,
          notes: 'Pasta lunch',
          carbsGrams: 65,
          insulinUnits: 6.0,
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: 'r-correlates-1',
        userId: testUserId,
        readingDate: '2026-11-10',
        slot: 'AFTER_LUNCH',
        value: 140,
        notes: 'Pasta lunch',
        carbsGrams: 65,
        insulinUnits: 6.0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('returns 401 UNAUTHORIZED when no auth cookie is sent', async () => {
      const res = await request.post('/api/readings').send({
        date: '2026-11-10',
        slot: 'MORNING_FASTING',
        value: 100,
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/readings', () => {
    it('returns 200 OK with paginated list of readings', async () => {
      const mockReadings = [
        createMockReading({ id: 'r-1', userId: testUserId, date: '2026-11-10', slot: 'AFTER_BREAKFAST', value: 130 }),
        createMockReading({ id: 'r-2', userId: testUserId, date: '2026-11-10', slot: 'MORNING_FASTING', value: 95 }),
      ];
      vi.spyOn(readingRepository, 'findManyByUser').mockResolvedValue({
        data: mockReadings,
        total: 2,
      });

      const res = await request
        .get('/api/readings?page=1&limit=20')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(20);
      expect(res.body.total).toBe(2);
      expect(res.body.totalPages).toBe(1);
    });
  });

  describe('PATCH /api/readings/:id', () => {
    it('updates a reading and returns 200 OK', async () => {
      const existing = createMockReading({ id: 'r-update-1', userId: testUserId, value: 90 });
      vi.spyOn(readingRepository, 'findById').mockResolvedValue(existing);
      vi.spyOn(readingRepository, 'update').mockResolvedValue({
        ...existing,
        value: 115,
        notes: 'Updated note',
      });

      const res = await request
        .patch('/api/readings/r-update-1')
        .set('Cookie', [authCookie])
        .send({ value: 115, notes: 'Updated note' });

      expect(res.status).toBe(200);
      expect(res.body.value).toBe(115);
      expect(res.body.notes).toBe('Updated note');
    });

    it('returns 404 NOT_FOUND when updating non-existent reading', async () => {
      vi.spyOn(readingRepository, 'findById').mockResolvedValue(null);

      const res = await request
        .patch('/api/readings/ghost-id')
        .set('Cookie', [authCookie])
        .send({ value: 120 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/readings/:id', () => {
    it('deletes reading and returns 204 No Content', async () => {
      const existing = createMockReading({ id: 'r-delete-1', userId: testUserId });
      vi.spyOn(readingRepository, 'findById').mockResolvedValue(existing);
      vi.spyOn(readingRepository, 'delete').mockResolvedValue(existing);

      const res = await request
        .delete('/api/readings/r-delete-1')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(204);
      expect(res.text).toBe('');
    });

    it('returns 404 NOT_FOUND when deleting non-existent reading', async () => {
      vi.spyOn(readingRepository, 'findById').mockResolvedValue(null);

      const res = await request
        .delete('/api/readings/ghost-id')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(404);
    });
  });
});
