import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { readingRepository } from '../../src/modules/readings/reading.repository.js';
import { issueTestToken, createAuthCookieHeader } from '../helpers/auth.js';
import { createMockReading } from '../factories/reading.factory.js';
import { ERROR_CODES } from '@sweety/shared/constants/errorCodes.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';

describe('Readings Concurrency & Daily Limit Precedence API', () => {
  const app = createApp();
  const request = supertest(app);
  const testUserId = 'concurrency-patient-uuid';
  let authCookie;

  beforeEach(() => {
    vi.restoreAllMocks();
    const token = issueTestToken({ id: testUserId, role: 'PATIENT' });
    authCookie = createAuthCookieHeader(token);
  });

  it('posting a 5th reading on the same day returns 409 DAILY_LIMIT (precedence over duplicate slot)', async () => {
    // 4 readings already recorded on 2026-11-10
    vi.spyOn(readingRepository, 'countByUserAndDate').mockResolvedValue(4);

    const res = await request
      .post('/api/readings')
      .set('Cookie', [authCookie])
      .send({
        date: '2026-11-10',
        slot: 'MORNING_FASTING',
        value: 110,
      });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: {
        code: ERROR_CODES.DAILY_LIMIT,
        message: MESSAGES.DAILY_LIMIT_EXCEEDED,
        details: [],
      },
    });
  });

  it('submitting a duplicate slot on a day with 3 readings returns 409 CONFLICT', async () => {
    vi.spyOn(readingRepository, 'countByUserAndDate').mockResolvedValue(3);
    vi.spyOn(readingRepository, 'findByUserDateAndSlot').mockResolvedValue(
      createMockReading({ userId: testUserId, date: '2026-11-10', slot: 'AFTER_LUNCH' }),
    );

    const res = await request
      .post('/api/readings')
      .set('Cookie', [authCookie])
      .send({
        date: '2026-11-10',
        slot: 'AFTER_LUNCH',
        value: 145,
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe(ERROR_CODES.CONFLICT);
    expect(res.body.error.message).toContain('After lunch');
  });

  it('handles database-level P2002 race-condition error and maps to 409 CONFLICT or DAILY_LIMIT', async () => {
    // Simulate race: check count passes (3), check slot passes (null), but DB insert throws P2002
    vi.spyOn(readingRepository, 'countByUserAndDate')
      .mockResolvedValueOnce(3) // initial check
      .mockResolvedValueOnce(3); // re-check on P2002
    vi.spyOn(readingRepository, 'findByUserDateAndSlot').mockResolvedValue(null);

    const uniqueConstraintError = new Error('Unique constraint violation');
    uniqueConstraintError.code = 'P2002';
    vi.spyOn(readingRepository, 'create').mockRejectedValue(uniqueConstraintError);

    const res = await request
      .post('/api/readings')
      .set('Cookie', [authCookie])
      .send({
        date: '2026-11-10',
        slot: 'AFTER_DINNER',
        value: 125,
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe(ERROR_CODES.CONFLICT);
    expect(res.body.error.message).toContain('After dinner');
  });
});
