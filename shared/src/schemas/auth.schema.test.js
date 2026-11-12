import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from './auth.schema.js';
import { MESSAGES } from '../constants/messages.js';

describe('auth.schema.js', () => {
  describe('registerSchema', () => {
    it('accepts valid registration payload and normalizes email to lowercase', () => {
      const payload = {
        name: '  Jane Doe  ',
        email: '  Jane.Doe@Example.COM  ',
        password: 'Password123!',
      };
      const parsed = registerSchema.parse(payload);
      expect(parsed.name).toBe('Jane Doe');
      expect(parsed.email).toBe('jane.doe@example.com');
      expect(parsed.password).toBe('Password123!');
    });

    it('strips extra fields like role (security rule: patient-only registration)', () => {
      const payload = {
        name: 'Dr. John',
        email: 'john@example.com',
        password: 'Password123!',
        role: 'DOCTOR',
      };
      const parsed = registerSchema.parse(payload);
      expect(parsed.role).toBeUndefined();
      expect(parsed.name).toBe('Dr. John');
    });

    it('rejects missing name', () => {
      const payload = {
        name: '   ',
        email: 'test@example.com',
        password: 'Password123!',
      };
      expect(() => registerSchema.parse(payload)).toThrowError(MESSAGES.AUTH_NAME_REQUIRED);
    });

    it('rejects invalid email', () => {
      const payload = {
        name: 'Jane Doe',
        email: 'not-an-email',
        password: 'Password123!',
      };
      expect(() => registerSchema.parse(payload)).toThrowError(MESSAGES.AUTH_EMAIL_INVALID);
    });

    it('rejects short password (< 8 characters)', () => {
      const payload = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'short',
      };
      expect(() => registerSchema.parse(payload)).toThrowError(MESSAGES.AUTH_PASSWORD_MIN);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid login credentials and normalizes email', () => {
      const payload = {
        email: ' USER@test.com ',
        password: 'secretpassword',
      };
      const parsed = loginSchema.parse(payload);
      expect(parsed.email).toBe('user@test.com');
      expect(parsed.password).toBe('secretpassword');
    });

    it('rejects empty password', () => {
      const payload = {
        email: 'user@test.com',
        password: '',
      };
      expect(() => loginSchema.parse(payload)).toThrowError(MESSAGES.AUTH_PASSWORD_REQUIRED);
    });
  });
});
