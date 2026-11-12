import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { doctorRepository } from '../../src/modules/doctors/doctor.repository.js';
import { reportRepository } from '../../src/modules/reports/report.repository.js';
import { userRepository } from '../../src/modules/users/user.repository.js';
import { issueTestToken, createAuthCookieHeader } from '../helpers/auth.js';
import { createMockReading } from '../factories/reading.factory.js';

describe('Module 13 — Doctor Role & Patient Access Control API', () => {
  const app = createApp();
  const request = supertest(app);

  const doctorId = 'a0000000-0000-4000-8000-000000000001';
  const linkedPatientId = 'b0000000-0000-4000-8000-000000000002';
  const unlinkedPatientId = 'c0000000-0000-4000-8000-000000000003';

  let doctorCookie;
  let patientCookie;

  beforeEach(() => {
    vi.restoreAllMocks();

    const doctorToken = issueTestToken({ id: doctorId, role: 'DOCTOR' });
    doctorCookie = createAuthCookieHeader(doctorToken);

    const patientToken = issueTestToken({ id: linkedPatientId, role: 'PATIENT' });
    patientCookie = createAuthCookieHeader(patientToken);
  });

  describe('GET /api/doctor/patients', () => {
    it('returns 401 UNAUTHORIZED when unauthenticated', async () => {
      const res = await request.get('/api/doctor/patients');
      expect(res.status).toBe(401);
    });

    it('returns 403 FORBIDDEN when accessed by a user with role PATIENT', async () => {
      const res = await request
        .get('/api/doctor/patients')
        .set('Cookie', [patientCookie]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 200 OK with linked patients for authenticated DOCTOR', async () => {
      const mockPatients = [
        { id: linkedPatientId, name: 'Alice Patient', email: 'alice@sweety.app' },
      ];

      vi.spyOn(doctorRepository, 'findLinkedPatients').mockResolvedValue(mockPatients);

      const res = await request
        .get('/api/doctor/patients')
        .set('Cookie', [doctorCookie]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        data: [
          { id: linkedPatientId, name: 'Alice Patient', email: 'alice@sweety.app' },
        ],
      });
      expect(doctorRepository.findLinkedPatients).toHaveBeenCalledWith(doctorId);
    });
  });

  describe('Doctor Patient Report Access (GET /api/reports/:type?patientId=)', () => {
    it('returns 403 FORBIDDEN when doctor requests report for an unlinked patient', async () => {
      vi.spyOn(reportRepository, 'isDoctorLinkedToPatient').mockResolvedValue(false);

      const res = await request
        .get(`/api/reports/daily?date=2026-11-10&patientId=${unlinkedPatientId}`)
        .set('Cookie', [doctorCookie]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(reportRepository.isDoctorLinkedToPatient).toHaveBeenCalledWith(doctorId, unlinkedPatientId);
    });

    it('returns 200 OK with clinical report when doctor requests report for a linked patient', async () => {
      vi.spyOn(reportRepository, 'isDoctorLinkedToPatient').mockResolvedValue(true);

      const mockReadings = [
        createMockReading({
          id: 'r1',
          value: 112,
          slot: 'MORNING_FASTING',
          date: '2026-11-10',
          userId: linkedPatientId,
        }),
      ];

      vi.spyOn(reportRepository, 'getReportData').mockResolvedValue({
        stats: {
          _count: { id: 1 },
          _min: { value: 112 },
          _max: { value: 112 },
          _avg: { value: 112 },
        },
        readings: mockReadings,
      });

      const res = await request
        .get(`/api/reports/daily?date=2026-11-10&patientId=${linkedPatientId}`)
        .set('Cookie', [doctorCookie]);

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('daily');
      expect(res.body.count).toBe(1);
      expect(res.body.average).toBe(112);
      expect(reportRepository.isDoctorLinkedToPatient).toHaveBeenCalledWith(doctorId, linkedPatientId);
      expect(reportRepository.getReportData).toHaveBeenCalledWith(linkedPatientId, '2026-11-10', '2026-11-10');
    });

    it('returns 403 FORBIDDEN when a PATIENT tries to pass another patientId', async () => {
      const res = await request
        .get(`/api/reports/daily?date=2026-11-10&patientId=${unlinkedPatientId}`)
        .set('Cookie', [patientCookie]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Registration Role Guard', () => {
    it('registering via POST /api/auth/register always produces a PATIENT, never a DOCTOR', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      const createSpy = vi.spyOn(userRepository, 'create').mockResolvedValue({
        id: 'new-patient-999',
        name: 'Attempted Doctor',
        email: 'attempted-doc@sweety.app',
        passwordHash: 'hashed_password',
        role: 'PATIENT',
      });

      const res = await request
        .post('/api/auth/register')
        .send({
          name: 'Attempted Doctor',
          email: 'attempted-doc@sweety.app',
          password: 'Password@123',
          role: 'DOCTOR', // Malicious attempt to claim doctor role
        });

      expect(res.status).toBe(201);
      expect(res.body.role).toBe('PATIENT');
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'PATIENT',
        }),
      );
    });
  });
});
