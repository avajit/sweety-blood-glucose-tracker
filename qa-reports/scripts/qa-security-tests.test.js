import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../server/src/app.js';
import { readingRepository } from '../../server/src/modules/readings/reading.repository.js';
import { reportRepository } from '../../server/src/modules/reports/report.repository.js';
import { userRepository } from '../../server/src/modules/users/user.repository.js';
import { refreshTokenStore } from '../../server/src/modules/auth/refreshToken.store.js';
import { signRefreshToken } from '../../server/src/modules/auth/token.service.js';
import { issueTestToken, createAuthCookieHeader } from '../../server/tests/helpers/auth.js';
import { COOKIE_NAMES } from '../../server/src/common/constants/cookieNames.js';
import { ERROR_CODES } from '@sweety/shared/constants/errorCodes.js';

describe('QA Phase 6: Security, Auth, IDOR & Access Control Test Suite', () => {
  const app = createApp();
  const request = supertest(app);
  const patientA = 'a0000000-0000-0000-0000-000000000001';
  const patientB = 'b0000000-0000-0000-0000-000000000002';
  const doctorA = 'c0000000-0000-0000-0000-000000000003';
  let authCookieAlice;
  let authCookieBob;
  let authCookieDoctor;

  beforeEach(() => {
    vi.restoreAllMocks();
    refreshTokenStore._clearMemory();
    authCookieAlice = createAuthCookieHeader(issueTestToken({ id: patientA, role: 'PATIENT' }));
    authCookieBob = createAuthCookieHeader(issueTestToken({ id: patientB, role: 'PATIENT' }));
    authCookieDoctor = createAuthCookieHeader(issueTestToken({ id: doctorA, role: 'DOCTOR' }));
  });

  describe('CSRF Defense: Exact Origin Check (originCheck.middleware)', () => {
    it('TC-SEC-01A: Rejects mutating POST request from unauthorized origin with 403 Forbidden', async () => {
      const res = await request
        .post('/api/readings')
        .set('Origin', 'http://malicious-phishing-site.com')
        .set('Cookie', [authCookieAlice])
        .send({
          date: '2026-11-12',
          slot: 'MORNING_FASTING',
          value: 120,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('TC-SEC-01B: Rejects mutating PATCH request with origin scheme mismatch (https vs http)', async () => {
      const res = await request
        .patch('/api/readings/some-id')
        .set('Origin', 'https://localhost:5173')
        .set('Cookie', [authCookieAlice])
        .send({ value: 130 });

      expect(res.status).toBe(403);
    });

    it('TC-SEC-01C: Rejects mutating DELETE request with trailing slash origin mismatch', async () => {
      const res = await request
        .delete('/api/readings/some-id')
        .set('Origin', 'http://localhost:5173/')
        .set('Cookie', [authCookieAlice]);

      expect(res.status).toBe(403);
    });

    it('TC-SEC-02: Allows safe GET requests even if cross-origin', async () => {
      vi.spyOn(readingRepository, 'findManyByUser').mockResolvedValue({ data: [], total: 0 });
      const res = await request
        .get('/api/readings?from=2026-11-01&to=2026-11-12')
        .set('Origin', 'http://another-site.com')
        .set('Cookie', [authCookieAlice]);

      expect(res.status).not.toBe(403);
    });

    it('TC-SEC-03: Allows mutating requests without Origin header (non-browser API / mobile clients)', async () => {
      vi.spyOn(readingRepository, 'countByUserAndDate').mockResolvedValue(0);
      vi.spyOn(readingRepository, 'findByUserDateAndSlot').mockResolvedValue(null);
      vi.spyOn(readingRepository, 'create').mockImplementation(async (d) => ({
        id: 'r-api-client',
        ...d,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookieAlice])
        // No Origin header set
        .send({
          date: '2026-11-12',
          slot: 'AFTER_DINNER',
          value: 110,
        });

      expect(res.status).toBe(201);
    });
  });

  describe('Registration Privilege Escalation & Role Tampering', () => {
    it('TC-SEC-04: Ignores "role": "DOCTOR" in public registration payload and enforces PATIENT', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      let capturedRole = null;
      vi.spyOn(userRepository, 'create').mockImplementation(async (userData) => {
        capturedRole = userData.role;
        return {
          id: 'new-user-tamper-id',
          name: userData.name,
          email: userData.email,
          role: userData.role,
        };
      });

      const res = await request
        .post('/api/auth/register')
        .send({
          name: 'Eve Attacker',
          email: 'eve@target.com',
          password: 'Password@123',
          role: 'DOCTOR',
        });

      expect(res.status).toBe(201);
      expect(capturedRole).toBe('PATIENT');
      expect(res.body.role).toBe('PATIENT');
    });

    it('TC-SEC-05: Ignores "role": "ADMIN" in registration payload', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      let capturedRole = null;
      vi.spyOn(userRepository, 'create').mockImplementation(async (userData) => {
        capturedRole = userData.role;
        return {
          id: 'new-user-admin-tamper',
          name: userData.name,
          email: userData.email,
          role: userData.role,
        };
      });

      const res = await request
        .post('/api/auth/register')
        .send({
          name: 'Eve Attacker',
          email: 'eve2@target.com',
          password: 'Password@123',
          role: 'ADMIN',
        });

      expect(res.status).toBe(201);
      expect(capturedRole).toBe('PATIENT');
    });
  });

  describe('IDOR & Multi-Tenant Data Isolation', () => {
    it('TC-SEC-06: Patient B cannot update Patient A reading (Returns 403 Forbidden, no data leak)', async () => {
      // Mock reading belongs to Alice
      vi.spyOn(readingRepository, 'findById').mockResolvedValue({
        id: 'reading-alice-001',
        userId: patientA,
        readingDate: new Date('2026-11-10T00:00:00.000Z'),
        slot: 'MORNING_FASTING',
        value: 105,
      });

      // Bob tries to update Alice's reading
      const res = await request
        .patch('/api/readings/reading-alice-001')
        .set('Cookie', [authCookieBob])
        .send({ value: 150 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('TC-SEC-07: Patient B cannot delete Patient A reading (Returns 403 Forbidden)', async () => {
      vi.spyOn(readingRepository, 'findById').mockResolvedValue({
        id: 'reading-alice-002',
        userId: patientA,
        readingDate: new Date('2026-11-10T00:00:00.000Z'),
        slot: 'MORNING_FASTING',
        value: 105,
      });

      const res = await request
        .delete('/api/readings/reading-alice-002')
        .set('Cookie', [authCookieBob]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('TC-SEC-08: Doctor cannot access report of patient not in their roster (Returns 403 Forbidden)', async () => {
      // Doctor Smith checks if Alice is linked
      vi.spyOn(reportRepository, 'isDoctorLinkedToPatient').mockResolvedValue(false);

      const res = await request
        .get(`/api/reports/daily?patientId=${patientA}&date=2026-11-12`)
        .set('Cookie', [authCookieDoctor]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });

  describe('Refresh Token Rotation & Replay Theft Detection', () => {
    it('TC-SEC-09: Replay of used/unregistered refresh token triggers theft detection and returns 401', async () => {
      const mockUser = { id: patientA, email: 'alice@sweety.app', role: 'PATIENT' };
      vi.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);

      // Issue token but do NOT save in store (simulating an already-consumed / revoked token)
      const { token: stolenOrReplayedToken } = signRefreshToken(mockUser);

      const res = await request
        .post('/api/auth/refresh')
        .set('Cookie', [`${COOKIE_NAMES.REFRESH_TOKEN}=${stolenOrReplayedToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  describe('SQL Injection & XSS Sanitization Resilience', () => {
    it('TC-SEC-10: SQL injection payload in query parameters is safely handled without 500 error', async () => {
      vi.spyOn(readingRepository, 'findManyByUser').mockResolvedValue({ data: [], total: 0 });

      const sqlPayload = "2026-11-01' OR '1'='1";
      const res = await request
        .get(`/api/readings?from=${encodeURIComponent(sqlPayload)}&to=2026-11-12`)
        .set('Cookie', [authCookieAlice]);

      // Should fail cleanly at validation layer (400) or return safely without SQL execution
      expect([400, 200]).toContain(res.status);
      expect(res.status).not.toBe(500);
    });

    it('TC-SEC-11: Reading notes containing XSS scripts are stored literally and not executed', async () => {
      vi.spyOn(readingRepository, 'countByUserAndDate').mockResolvedValue(0);
      vi.spyOn(readingRepository, 'findByUserDateAndSlot').mockResolvedValue(null);
      const xssPayload = "<script>alert('XSS-PWNED')</script>";
      vi.spyOn(readingRepository, 'create').mockImplementation(async (d) => ({
        id: 'r-xss-test',
        ...d,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookieAlice])
        .send({
          date: '2026-11-12',
          slot: 'AFTER_DINNER',
          value: 125,
          notes: xssPayload,
        });

      expect(res.status).toBe(201);
      expect(res.body.notes).toBe(xssPayload); // Stored as literal string
    });
  });
});
