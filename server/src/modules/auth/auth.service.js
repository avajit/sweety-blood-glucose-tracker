import { ROLES } from '@sweety/shared/constants/roles.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';
import { ConflictError, UnauthorizedError } from '../../common/errors/httpErrors.js';
import { userRepository as defaultUserRepo } from '../users/user.repository.js';
import { toPublicUser } from '../users/user.mapper.js';
import { hashPassword, comparePassword, dummyCompare } from './password.hasher.js';
import { signToken, verifyToken } from './token.service.js';

/**
 * Service encapsulating business logic for authentication and identity management.
 */
export class AuthService {
  /**
   * @param {import('../users/user.repository.js').UserRepository} [userRepo]
   * @param {object} [hasher]
   * @param {object} [tokenService]
   */
  constructor(
    userRepo = defaultUserRepo,
    hasher = { hashPassword, comparePassword, dummyCompare },
    tokenService = { signToken, verifyToken },
  ) {
    this.userRepo = userRepo;
    this.hasher = hasher;
    this.tokenService = tokenService;
  }

  /**
   * Registers a new patient.
   * Security Rule: Always creates a PATIENT account. Never accepts or trusts role from request.
   *
   * @param {object} params
   * @param {string} params.name
   * @param {string} params.email
   * @param {string} params.password
   * @returns {Promise<{ user: object, token: string }>}
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

    const token = this.tokenService.signToken({
      id: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
    });

    return {
      user: toPublicUser(createdUser),
      token,
    };
  }

  /**
   * Authenticates user credentials with timing-safe comparison.
   *
   * @param {object} params
   * @param {string} params.email
   * @param {string} params.password
   * @returns {Promise<{ user: object, token: string }>}
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

    const token = this.tokenService.signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: toPublicUser(user),
      token,
    };
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
