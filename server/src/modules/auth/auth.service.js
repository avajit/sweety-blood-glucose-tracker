import { ROLES } from '@sweety/shared/constants/roles.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';
import { ConflictError, UnauthorizedError } from '../../common/errors/httpErrors.js';
import { userRepository as defaultUserRepo } from '../users/user.repository.js';
import { toPublicUser } from '../users/user.mapper.js';
import { hashPassword, comparePassword, dummyCompare } from './password.hasher.js';
import { signToken, signAccessToken, signRefreshToken, verifyToken } from './token.service.js';
import { refreshTokenStore as defaultTokenStore } from './refreshToken.store.js';

/**
 * Service encapsulating business logic for authentication and identity management.
 */
export class AuthService {
  /**
   * @param {import('../users/user.repository.js').UserRepository} [userRepo]
   * @param {object} [hasher]
   * @param {object} [tokenService]
   * @param {object} [tokenStore]
   */
  constructor(
    userRepo = defaultUserRepo,
    hasher = { hashPassword, comparePassword, dummyCompare },
    tokenService = { signToken, signAccessToken, signRefreshToken, verifyToken },
    tokenStore = defaultTokenStore,
  ) {
    this.userRepo = userRepo;
    this.hasher = hasher;
    this.tokenService = tokenService;
    this.tokenStore = tokenStore;
  }

  /**
   * Registers a new patient.
   * Security Rule: Always creates a PATIENT account. Never accepts or trusts role from request.
   *
   * @param {object} params
   * @param {string} params.name
   * @param {string} params.email
   * @param {string} params.password
   * @returns {Promise<{ user: object, token: string, refreshToken: string }>}
   */
  async register({ name, email, password }) {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new ConflictError(MESSAGES.AUTH_EMAIL_TAKEN);
    }

    const passwordHash = await this.hasher.hashPassword(password);

    // Hardcoded PATIENT role — doctors are seed-only
    const createdUser = await this.userRepo.create({
      name,
      email,
      passwordHash,
      role: ROLES.PATIENT,
    });

    const tokenPayload = {
      id: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
    };

    const accessToken = this.tokenService.signAccessToken
      ? this.tokenService.signAccessToken(tokenPayload)
      : this.tokenService.signToken(tokenPayload);

    const { token: refreshToken, jti } = this.tokenService.signRefreshToken
      ? this.tokenService.signRefreshToken(tokenPayload)
      : { token: accessToken, jti: 'default-jti' };
    if (this.tokenStore?.save) {
      await this.tokenStore.save(createdUser.id, jti);
    }

    return {
      user: toPublicUser(createdUser),
      token: accessToken,
      refreshToken,
    };
  }

  /**
   * Authenticates user credentials with timing-safe comparison.
   *
   * @param {object} params
   * @param {string} params.email
   * @param {string} params.password
   * @returns {Promise<{ user: object, token: string, refreshToken: string }>}
   */
  async login({ email, password }) {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      // Timing side-channel mitigation: perform dummy hash calculation
      await this.hasher.dummyCompare(password);
      throw new UnauthorizedError(MESSAGES.AUTH_INVALID_CREDENTIALS);
    }

    const isValidPassword = await this.hasher.comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError(MESSAGES.AUTH_INVALID_CREDENTIALS);
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.tokenService.signAccessToken
      ? this.tokenService.signAccessToken(tokenPayload)
      : this.tokenService.signToken(tokenPayload);

    const { token: refreshToken, jti } = this.tokenService.signRefreshToken
      ? this.tokenService.signRefreshToken(tokenPayload)
      : { token: accessToken, jti: 'default-jti' };
    if (this.tokenStore?.save) {
      await this.tokenStore.save(user.id, jti);
    }

    return {
      user: toPublicUser(user),
      token: accessToken,
      refreshToken,
    };
  }

  /**
   * Rotates a refresh token and generates a new access & refresh token pair.
   * Detects and blocks replay/reuse attacks.
   *
   * @param {string} refreshTokenString
   * @returns {Promise<{ user: object, token: string, refreshToken: string }>}
   */
  async rotateToken(refreshTokenString) {
    if (!refreshTokenString) {
      throw new UnauthorizedError(MESSAGES.AUTH_UNAUTHORIZED);
    }

    let decoded;
    try {
      decoded = this.tokenService.verifyToken(refreshTokenString);
    } catch {
      throw new UnauthorizedError(MESSAGES.AUTH_UNAUTHORIZED);
    }

    if (!decoded.id || !decoded.jti || decoded.tokenType !== 'refresh') {
      throw new UnauthorizedError(MESSAGES.AUTH_UNAUTHORIZED);
    }

    // Attempt to consume this refresh token JTI
    const isValid = await this.tokenStore.consume(decoded.id, decoded.jti);
    if (!isValid) {
      // Replay or theft detected! Invalidate all tokens for this user
      await this.tokenStore.revokeAll(decoded.id);
      throw new UnauthorizedError('Token reuse detected. All sessions revoked. Please log in again.');
    }

    const user = await this.userRepo.findById(decoded.id);
    if (!user) {
      throw new UnauthorizedError(MESSAGES.AUTH_UNAUTHORIZED);
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = this.tokenService.signAccessToken
      ? this.tokenService.signAccessToken(tokenPayload)
      : this.tokenService.signToken(tokenPayload);

    const { token: newRefreshToken, jti: newJti } = this.tokenService.signRefreshToken(tokenPayload);
    await this.tokenStore.save(user.id, newJti);

    return {
      user: toPublicUser(user),
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Revokes a specific refresh token upon logout.
   * @param {string} userId
   * @param {string} jti
   */
  async logout(userId, jti) {
    if (userId && jti) {
      await this.tokenStore.revoke(userId, jti);
    }
  }

  /**
   * Retrieves the current authenticated user's profile.
   *
   * @param {string} userId - From req.user.id
   * @returns {Promise<object>} Safe public user object
   */
  async getMe(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedError(MESSAGES.AUTH_UNAUTHORIZED);
    }

    return toPublicUser(user);
  }
}

export const authService = new AuthService();
