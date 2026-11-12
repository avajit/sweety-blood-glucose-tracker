import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { userRepository } from '../../src/modules/users/user.repository.js';
import { refreshTokenStore } from '../../src/modules/auth/refreshToken.store.js';
import { signRefreshToken } from '../../src/modules/auth/token.service.js';
import { COOKIE_NAMES } from '../../src/common/constants/cookieNames.js';

describe('Auth Refresh Token Rotation API (POST /api/auth/refresh)', () => {
  const app = createApp();
  const request = supertest(app);

  const mockUser = {
    id: 'user-refresh-123',
    name: 'Sarah Connor',
    email: 'sarah@sweety.app',
    role: 'PATIENT',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    refreshTokenStore._clearMemory();
  });

  it('successfully rotates a valid refresh token and sets new cookies', async () => {
    vi.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);

    // 1. Issue and store a refresh token
    const { token: initialRefreshToken, jti } = signRefreshToken(mockUser);
    await refreshTokenStore.save(mockUser.id, jti);

    // 2. Call /api/auth/refresh with the refresh token cookie
    const res = await request
      .post('/api/auth/refresh')
      .set('Cookie', [`${COOKIE_NAMES.REFRESH_TOKEN}=${initialRefreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Token rotated');
    expect(res.body.user.email).toBe(mockUser.email);

    // 3. Verify new cookies were set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const authCookie = cookies.find((c) => c.startsWith(`${COOKIE_NAMES.AUTH_TOKEN}=`));
    const refreshCookie = cookies.find((c) => c.startsWith(`${COOKIE_NAMES.REFRESH_TOKEN}=`));
    expect(authCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();
  });

  it('rejects with 401 when refresh token is missing', async () => {
    const res = await request.post('/api/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects with 401 when refresh token is invalid or malformed', async () => {
    const res = await request
      .post('/api/auth/refresh')
      .set('Cookie', [`${COOKIE_NAMES.REFRESH_TOKEN}=invalid.jwt.token`]);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('detects token reuse / theft when an old refresh token is reused and revokes sessions', async () => {
    vi.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);

    const { token: initialRefreshToken, jti } = signRefreshToken(mockUser);
    await refreshTokenStore.save(mockUser.id, jti);

    // First rotation: valid
    const res1 = await request
      .post('/api/auth/refresh')
      .set('Cookie', [`${COOKIE_NAMES.REFRESH_TOKEN}=${initialRefreshToken}`]);
    expect(res1.status).toBe(200);

    // Second rotation with the same old token (Replay Attack simulation): must be rejected
    const res2 = await request
      .post('/api/auth/refresh')
      .set('Cookie', [`${COOKIE_NAMES.REFRESH_TOKEN}=${initialRefreshToken}`]);

    expect(res2.status).toBe(401);
    expect(res2.body.error.message).toContain('reuse detected');
  });

  it('revokes the refresh token upon logout', async () => {
    vi.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);

    const { token: initialRefreshToken, jti } = signRefreshToken(mockUser);
    await refreshTokenStore.save(mockUser.id, jti);

    // Logout
    const logoutRes = await request
      .post('/api/auth/logout')
      .set('Cookie', [`${COOKIE_NAMES.REFRESH_TOKEN}=${initialRefreshToken}`]);
    expect(logoutRes.status).toBe(200);

    // Refresh after logout should fail
    const refreshRes = await request
      .post('/api/auth/refresh')
      .set('Cookie', [`${COOKIE_NAMES.REFRESH_TOKEN}=${initialRefreshToken}`]);
    expect(refreshRes.status).toBe(401);
  });
});
