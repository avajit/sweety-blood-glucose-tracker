import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { userRepository } from '../../src/modules/users/user.repository.js';
import { hashPassword } from '../../src/modules/auth/password.hasher.js';
import { issueTestToken } from '../helpers/auth.js';
import { COOKIE_NAMES } from '../../src/common/constants/cookieNames.js';
import { ERROR_CODES } from '@sweety/shared/constants/errorCodes.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';

describe('Auth API (POST /register, POST /login, POST /logout, GET /me)', () => {
  const app = createApp();
  const request = supertest(app);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('creates a patient account and sets the httpOnly session cookie', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      vi.spyOn(userRepository, 'create').mockResolvedValue({
        id: 'new-user-123',
        name: 'Sarah Connor',
        email: 'sarah@sweety.app',
        passwordHash: 'hashed_pw',
        role: 'PATIENT',
      });

      const res = await request.post('/api/auth/register').send({
        name: 'Sarah Connor',
        email: 'sarah@sweety.app',
        password: 'ValidPassword@123',
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: 'new-user-123',
        name: 'Sarah Connor',
        email: 'sarah@sweety.app',
        role: 'PATIENT',
      });
      expect(res.body.passwordHash).toBeUndefined();

      // Verify Set-Cookie header
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const authCookie = cookies.find((c) => c.startsWith(`${COOKIE_NAMES.AUTH_TOKEN}=`));
      expect(authCookie).toBeDefined();
      expect(authCookie).toContain('HttpOnly');
      expect(authCookie).toContain('Path=/');
      expect(authCookie).toContain('SameSite=Lax');
    });

    it('strictly forces PATIENT role even if role: "DOCTOR" is passed in body', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      const createSpy = vi.spyOn(userRepository, 'create').mockResolvedValue({
        id: 'new-user-456',
        name: 'Malicious Attempt',
        email: 'attempt@sweety.app',
        passwordHash: 'hashed_pw',
        role: 'PATIENT',
      });

      const res = await request.post('/api/auth/register').send({
        name: 'Malicious Attempt',
        email: 'attempt@sweety.app',
        password: 'ValidPassword@123',
        role: 'DOCTOR', // Injected role
      });

      expect(res.status).toBe(201);
      expect(res.body.role).toBe('PATIENT');
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'PATIENT',
        }),
      );
    });

    it('returns 409 CONFLICT if email is already taken', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue({ id: 'existing-id' });

      const res = await request.post('/api/auth/register').send({
        name: 'Duplicate User',
        email: 'taken@sweety.app',
        password: 'ValidPassword@123',
      });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        error: {
          code: ERROR_CODES.CONFLICT,
          message: MESSAGES.AUTH_EMAIL_TAKEN,
          details: [],
        },
      });
    });

    it('returns 400 VALIDATION_ERROR if password is shorter than 8 characters', async () => {
      const res = await request.post('/api/auth/register').send({
        name: 'Short Password',
        email: 'short@sweety.app',
        password: '123',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('returns 400 VALIDATION_ERROR if name is empty or missing', async () => {
      const res = await request.post('/api/auth/register').send({
        name: '   ',
        email: 'noname@sweety.app',
        password: 'ValidPassword@123',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('returns 400 VALIDATION_ERROR if email format is invalid', async () => {
      const res = await request.post('/api/auth/register').send({
        name: 'Bad Email',
        email: 'not-a-valid-email',
        password: 'ValidPassword@123',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('POST /api/auth/login', () => {
    it('authenticates valid credentials, returns user and sets cookie', async () => {
      const hashedPassword = await hashPassword('ValidPassword@123');
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue({
        id: 'patient-789',
        name: 'Valid Patient',
        email: 'patient@sweety.app',
        passwordHash: hashedPassword,
        role: 'PATIENT',
      });

      const res = await request.post('/api/auth/login').send({
        email: 'patient@sweety.app',
        password: 'ValidPassword@123',
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: 'patient-789',
        name: 'Valid Patient',
        email: 'patient@sweety.app',
        role: 'PATIENT',
      });
      expect(res.body.passwordHash).toBeUndefined();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.startsWith(`${COOKIE_NAMES.AUTH_TOKEN}=`))).toBe(true);
    });

    it('returns 401 UNAUTHORIZED on incorrect password', async () => {
      const hashedPassword = await hashPassword('CorrectPassword@123');
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue({
        id: 'patient-789',
        name: 'Valid Patient',
        email: 'patient@sweety.app',
        passwordHash: hashedPassword,
        role: 'PATIENT',
      });

      const res = await request.post('/api/auth/login').send({
        email: 'patient@sweety.app',
        password: 'WrongPassword@123',
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: MESSAGES.AUTH_INVALID_CREDENTIALS,
          details: [],
        },
      });
    });

    it('returns 401 UNAUTHORIZED when email does not exist', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);

      const res = await request.post('/api/auth/login').send({
        email: 'unknown@sweety.app',
        password: 'AnyPassword@123',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('normalizes email with whitespace and mixed casing during login', async () => {
      const hashedPassword = await hashPassword('ValidPassword@123');
      const findSpy = vi.spyOn(userRepository, 'findByEmail').mockResolvedValue({
        id: 'patient-789',
        name: 'Valid Patient',
        email: 'patient@sweety.app',
        passwordHash: hashedPassword,
        role: 'PATIENT',
      });

      const res = await request.post('/api/auth/login').send({
        email: '   PATIENT@SWEETY.APP   ',
        password: 'ValidPassword@123',
      });

      expect(res.status).toBe(200);
      expect(findSpy).toHaveBeenCalledWith('patient@sweety.app');
    });

    it('returns 400 VALIDATION_ERROR when email or password is missing', async () => {
      const res = await request.post('/api/auth/login').send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user profile when valid token cookie is provided', async () => {
      const token = issueTestToken({ id: 'user-auth-10', email: 'me@sweety.app', role: 'PATIENT' });
      vi.spyOn(userRepository, 'findById').mockResolvedValue({
        id: 'user-auth-10',
        name: 'Me Patient',
        email: 'me@sweety.app',
        passwordHash: 'secret_hash',
        role: 'PATIENT',
      });

      const res = await request
        .get('/api/auth/me')
        .set('Cookie', [`${COOKIE_NAMES.AUTH_TOKEN}=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: 'user-auth-10',
        name: 'Me Patient',
        email: 'me@sweety.app',
        role: 'PATIENT',
      });
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('authenticates via Authorization: Bearer <token> header fallback', async () => {
      const token = issueTestToken({ id: 'user-auth-10', email: 'me@sweety.app', role: 'PATIENT' });
      vi.spyOn(userRepository, 'findById').mockResolvedValue({
        id: 'user-auth-10',
        name: 'Me Patient',
        email: 'me@sweety.app',
        passwordHash: 'secret_hash',
        role: 'PATIENT',
      });

      const res = await request
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('user-auth-10');
    });

    it('returns 401 UNAUTHORIZED on invalid or tampered JWT signature', async () => {
      const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.tamperedSignature';

      const res = await request
        .get('/api/auth/me')
        .set('Cookie', [`${COOKIE_NAMES.AUTH_TOKEN}=${tamperedToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('returns 401 UNAUTHORIZED if user from valid token no longer exists in database', async () => {
      const token = issueTestToken({ id: 'deleted-user-id' });
      vi.spyOn(userRepository, 'findById').mockResolvedValue(null);

      const res = await request
        .get('/api/auth/me')
        .set('Cookie', [`${COOKIE_NAMES.AUTH_TOKEN}=${token}`]);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('returns 401 UNAUTHORIZED when no cookie or header is provided', async () => {
      const res = await request.get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears the authentication cookie and responds with 200 OK', async () => {
      const res = await request.post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Logged out' });

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const clearedCookie = cookies.find((c) => c.startsWith(`${COOKIE_NAMES.AUTH_TOKEN}=`));
      expect(clearedCookie).toBeDefined();
      // Cookie is expired immediately
      expect(clearedCookie).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/);
    });
  });
});
