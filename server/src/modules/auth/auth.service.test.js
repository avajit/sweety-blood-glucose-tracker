import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import { ConflictError, UnauthorizedError } from '../../common/errors/httpErrors.js';
import { ROLES } from '@sweety/shared/constants/roles.js';

describe('AuthService', () => {
  let mockUserRepo;
  let mockHasher;
  let mockTokenService;
  let authService;

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
    };
    mockHasher = {
      hashPassword: vi.fn().mockResolvedValue('hashed_pw_123'),
      comparePassword: vi.fn(),
      dummyCompare: vi.fn().mockResolvedValue(false),
    };
    mockTokenService = {
      signToken: vi.fn().mockReturnValue('mock_jwt_token_xyz'),
      signAccessToken: vi.fn().mockReturnValue('mock_jwt_token_xyz'),
      signRefreshToken: vi.fn().mockReturnValue({ token: 'mock_refresh_token_xyz', jti: 'jti-123' }),
      verifyToken: vi.fn(),
    };

    authService = new AuthService(mockUserRepo, mockHasher, mockTokenService);
  });

  describe('register', () => {
    it('creates a new user with hardcoded PATIENT role and returns public user + token', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue({
        id: 'u-1',
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed_pw_123',
        role: 'PATIENT',
      });

      const result = await authService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password@123',
        role: 'DOCTOR', // Even if attacker injects role, service must ignore it
      });

      expect(mockUserRepo.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed_pw_123',
        role: ROLES.PATIENT, // strictly PATIENT
      });
      expect(result.token).toBe('mock_jwt_token_xyz');
      expect(result.user).toEqual({
        id: 'u-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'PATIENT',
      });
      expect(result.user.passwordHash).toBeUndefined();
    });

    it('throws ConflictError when email is already registered', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ id: 'existing-id' });

      await expect(
        authService.register({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password@123',
        }),
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('login', () => {
    it('returns public user and token when credentials are valid', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        id: 'u-2',
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: 'stored_hash',
        role: 'PATIENT',
      });
      mockHasher.comparePassword.mockResolvedValue(true);

      const result = await authService.login({
        email: 'jane@example.com',
        password: 'Password@123',
      });

      expect(result.token).toBe('mock_jwt_token_xyz');
      expect(result.user).toEqual({
        id: 'u-2',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'PATIENT',
      });
      expect(result.user.passwordHash).toBeUndefined();
    });

    it('throws UnauthorizedError and runs dummy compare when email does not exist (timing-safe)', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Password@123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedError);

      expect(mockHasher.dummyCompare).toHaveBeenCalledWith('Password@123');
      expect(mockHasher.comparePassword).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedError when password does not match', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        id: 'u-3',
        email: 'jane@example.com',
        passwordHash: 'stored_hash',
      });
      mockHasher.comparePassword.mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'jane@example.com',
          password: 'WrongPassword@123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('getMe', () => {
    it('returns public user when ID exists', async () => {
      mockUserRepo.findById.mockResolvedValue({
        id: 'u-10',
        name: 'Patient Smith',
        email: 'smith@example.com',
        passwordHash: 'secret_hash',
        role: 'PATIENT',
      });

      const user = await authService.getMe('u-10');

      expect(user).toEqual({
        id: 'u-10',
        name: 'Patient Smith',
        email: 'smith@example.com',
        role: 'PATIENT',
      });
      expect(user.passwordHash).toBeUndefined();
    });

    it('throws UnauthorizedError when user ID does not exist', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(authService.getMe('ghost-id')).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });
});
