import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../server/src/app.js';
import { readingRepository } from '../../server/src/modules/readings/reading.repository.js';
import { issueTestToken, createAuthCookieHeader } from '../../server/tests/helpers/auth.js';
import { ERROR_CODES } from '@sweety/shared/constants/errorCodes.js';

describe('QA Phase 4 & 5: Boundary & Business Logic Test Suite', () => {
  const app = createApp();
  const request = supertest(app);
  const patientUserId = 'qa-patient-boundary-001';
  let authCookie;

  beforeEach(() => {
    vi.restoreAllMocks();
    const token = issueTestToken({ id: patientUserId, role: 'PATIENT' });
    authCookie = createAuthCookieHeader(token);
  });

  describe('Blood Glucose Value Boundaries [40, 600]', () => {
    it('TC-READ-01: Accepts lower physiological boundary of exactly 40 mg/dL', async () => {
      vi.spyOn(readingRepository, 'countByUserAndDate').mockResolvedValue(0);
      vi.spyOn(readingRepository, 'findByUserDateAndSlot').mockResolvedValue(null);
      vi.spyOn(readingRepository, 'create').mockImplementation(async (data) => ({
        id: 'qa-r-40',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'MORNING_FASTING',
          value: 40,
        });

      expect(res.status).toBe(201);
      expect(res.body.value).toBe(40);
    });

    it('TC-READ-02: Rejects value below 40 (39 mg/dL) with 400 VALIDATION_ERROR', async () => {
      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'MORNING_FASTING',
          value: 39,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(res.body.error.details.some((d) => d.field === 'value')).toBe(true);
    });

    it('TC-READ-03: Accepts upper physiological boundary of exactly 600 mg/dL', async () => {
      vi.spyOn(readingRepository, 'countByUserAndDate').mockResolvedValue(0);
      vi.spyOn(readingRepository, 'findByUserDateAndSlot').mockResolvedValue(null);
      vi.spyOn(readingRepository, 'create').mockImplementation(async (data) => ({
        id: 'qa-r-600',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'AFTER_DINNER',
          value: 600,
        });

      expect(res.status).toBe(201);
      expect(res.body.value).toBe(600);
    });

    it('TC-READ-04: Rejects value above 600 (601 mg/dL) with 400 VALIDATION_ERROR', async () => {
      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'AFTER_DINNER',
          value: 601,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(res.body.error.details.some((d) => d.field === 'value')).toBe(true);
    });

    it('TC-READ-05A: Rejects decimal floating point glucose values (120.5 mg/dL)', async () => {
      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'MORNING_FASTING',
          value: 120.5,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('TC-READ-05B: Rejects negative glucose values (-10 mg/dL)', async () => {
      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'MORNING_FASTING',
          value: -10,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('TC-READ-05C: Rejects non-numeric strings ("one-twenty")', async () => {
      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'MORNING_FASTING',
          value: 'one-twenty',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('Slot Values & Invalid Slot Rejection', () => {
    it('TC-READ-07A: Rejects invalid or undocumented slots (e.g., "BEDTIME", "MIDNIGHT_SNACK")', async () => {
      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'BEDTIME',
          value: 120,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(res.body.error.details.some((d) => d.field === 'slot')).toBe(true);
    });

    it('TC-READ-07B: Rejects slots from outdated docs (e.g., "FASTING" instead of "MORNING_FASTING")', async () => {
      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'FASTING',
          value: 120,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('Clinical Correlate Boundaries: Carbs [0, 300] & Insulin [0, 100]', () => {
    it('TC-READ-10A: Accepts boundary carbs values (0g and 300g)', async () => {
      vi.spyOn(readingRepository, 'countByUserAndDate').mockResolvedValue(0);
      vi.spyOn(readingRepository, 'findByUserDateAndSlot').mockResolvedValue(null);
      vi.spyOn(readingRepository, 'create').mockImplementation(async (data) => ({
        id: 'qa-carbs-valid',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'AFTER_BREAKFAST',
          value: 110,
          carbsGrams: 0,
        });
      expect(res.status).toBe(201);
      expect(res.body.carbsGrams).toBe(0);

      const res2 = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'AFTER_LUNCH',
          value: 140,
          carbsGrams: 300,
        });
      expect(res2.status).toBe(201);
      expect(res2.body.carbsGrams).toBe(300);
    });

    it('TC-READ-10B: Rejects negative carbs (-1g) and excessive carbs (301g)', async () => {
      const res1 = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'AFTER_BREAKFAST',
          value: 110,
          carbsGrams: -1,
        });
      expect(res1.status).toBe(400);

      const res2 = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'AFTER_BREAKFAST',
          value: 110,
          carbsGrams: 301,
        });
      expect(res2.status).toBe(400);
    });

    it('TC-READ-11A: Accepts boundary insulin units (0u and 100u)', async () => {
      vi.spyOn(readingRepository, 'countByUserAndDate').mockResolvedValue(0);
      vi.spyOn(readingRepository, 'findByUserDateAndSlot').mockResolvedValue(null);
      vi.spyOn(readingRepository, 'create').mockImplementation(async (data) => ({
        id: 'qa-insulin-valid',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'AFTER_BREAKFAST',
          value: 130,
          insulinUnits: 0,
        });
      expect(res.status).toBe(201);
      expect(res.body.insulinUnits).toBe(0);

      const res2 = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'AFTER_DINNER',
          value: 160,
          insulinUnits: 100,
        });
      expect(res2.status).toBe(201);
      expect(res2.body.insulinUnits).toBe(100);
    });

    it('TC-READ-11B: Rejects negative insulin (-0.5u) and excessive insulin (101u)', async () => {
      const res1 = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'AFTER_DINNER',
          value: 130,
          insulinUnits: -0.5,
        });
      expect(res1.status).toBe(400);

      const res2 = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'AFTER_DINNER',
          value: 130,
          insulinUnits: 101,
        });
      expect(res2.status).toBe(400);
    });
  });

  describe('Slot Constraints & Daily Limit (4 per day)', () => {
    it('TC-READ-08: Rejects duplicate meal slot on same calendar day with 409 Conflict', async () => {
      vi.spyOn(readingRepository, 'countByUserAndDate').mockResolvedValue(1);
      vi.spyOn(readingRepository, 'findByUserDateAndSlot').mockResolvedValue({
        id: 'existing-reading-1',
        userId: patientUserId,
        readingDate: new Date('2026-11-12T00:00:00.000Z'),
        slot: 'MORNING_FASTING',
        value: 110,
      });

      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'MORNING_FASTING',
          value: 115,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe(ERROR_CODES.CONFLICT);
    });

    it('TC-READ-09: Rejects 5th reading on same calendar day with 409 DAILY_LIMIT', async () => {
      vi.spyOn(readingRepository, 'countByUserAndDate').mockResolvedValue(4);

      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-12',
          slot: 'AFTER_DINNER',
          value: 120,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe(ERROR_CODES.DAILY_LIMIT);
    });
  });

  describe('Date Integrity & Future Date Rejection', () => {
    it('TC-READ-13: Rejects future date inputs with 422 FUTURE_DATE', async () => {
      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2099-12-31',
          slot: 'MORNING_FASTING',
          value: 100,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe(ERROR_CODES.FUTURE_DATE);
    });

    it('TC-READ-14: Rejects malformed date strings ("2026-02-31" or invalid syntax)', async () => {
      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-02-31',
          slot: 'MORNING_FASTING',
          value: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });
});
