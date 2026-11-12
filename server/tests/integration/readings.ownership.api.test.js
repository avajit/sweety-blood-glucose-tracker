import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { readingRepository } from '../../src/modules/readings/reading.repository.js';
import { issueTestToken, createAuthCookieHeader } from '../helpers/auth.js';
import { createMockReading } from '../factories/reading.factory.js';
import { ERROR_CODES } from '@sweety/shared/constants/errorCodes.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';

describe('Readings Ownership & Access Control API', () => {
  const app = createApp();
  const request = supertest(app);
  const ownerUserId = 'owner-patient-uuid';
  const strangerUserId = 'stranger-patient-uuid';
  let strangerCookie;
  let ownerCookie;

  beforeEach(() => {
    vi.restoreAllMocks();
    const ownerToken = issueTestToken({ id: ownerUserId, role: 'PATIENT' });
    const strangerToken = issueTestToken({ id: strangerUserId, role: 'PATIENT' });
    ownerCookie = createAuthCookieHeader(ownerToken);
    strangerCookie = createAuthCookieHeader(strangerToken);
  });

  describe('PATCH /api/readings/:id', () => {
    it('returns 403 FORBIDDEN when user attempts to update another patient reading', async () => {
      const existing = createMockReading({
        id: 'reading-owner-1',
        userId: ownerUserId,
        value: 120,
      });
      vi.spyOn(readingRepository, 'findById').mockResolvedValue(existing);

      const res = await request
        .patch('/api/readings/reading-owner-1')
        .set('Cookie', [strangerCookie])
        .send({ value: 140 });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: MESSAGES.AUTH_FORBIDDEN,
          details: [],
        },
      });
    });

    it('returns 404 NOT_FOUND when updating a non-existent reading', async () => {
      vi.spyOn(readingRepository, 'findById').mockResolvedValue(null);

      const res = await request
        .patch('/api/readings/non-existent-uuid')
        .set('Cookie', [ownerCookie])
        .send({ value: 110 });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it('allows the owner to update their own reading', async () => {
      const existing = createMockReading({
        id: 'reading-owner-2',
        userId: ownerUserId,
        value: 115,
      });
      vi.spyOn(readingRepository, 'findById').mockResolvedValue(existing);
      vi.spyOn(readingRepository, 'update').mockResolvedValue({
        ...existing,
        value: 125,
      });

      const res = await request
        .patch('/api/readings/reading-owner-2')
        .set('Cookie', [ownerCookie])
        .send({ value: 125 });

      expect(res.status).toBe(200);
      expect(res.body.value).toBe(125);
    });
  });

  describe('DELETE /api/readings/:id', () => {
    it('returns 403 FORBIDDEN when user attempts to delete another patient reading', async () => {
      const existing = createMockReading({
        id: 'reading-owner-3',
        userId: ownerUserId,
      });
      vi.spyOn(readingRepository, 'findById').mockResolvedValue(existing);
      const deleteSpy = vi.spyOn(readingRepository, 'delete');

      const res = await request
        .delete('/api/readings/reading-owner-3')
        .set('Cookie', [strangerCookie]);

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: MESSAGES.AUTH_FORBIDDEN,
          details: [],
        },
      });
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('returns 404 NOT_FOUND when deleting a non-existent reading', async () => {
      vi.spyOn(readingRepository, 'findById').mockResolvedValue(null);

      const res = await request
        .delete('/api/readings/non-existent-uuid')
        .set('Cookie', [ownerCookie]);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it('allows the owner to delete their reading and returns 204 No Content', async () => {
      const existing = createMockReading({
        id: 'reading-owner-4',
        userId: ownerUserId,
      });
      vi.spyOn(readingRepository, 'findById').mockResolvedValue(existing);
      const deleteSpy = vi.spyOn(readingRepository, 'delete').mockResolvedValue(existing);

      const res = await request
        .delete('/api/readings/reading-owner-4')
        .set('Cookie', [ownerCookie]);

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
      expect(deleteSpy).toHaveBeenCalledWith('reading-owner-4');
    });
  });
});
