import { prisma as defaultPrisma } from '../../lib/prisma.js';

/**
 * Repository layer for the User model.
 * The only layer permitted to directly execute Prisma queries on the User table.
 */
export class UserRepository {
  /**
   * @param {import('@prisma/client').PrismaClient} [prisma]
   */
  constructor(prisma = defaultPrisma) {
    this.prisma = prisma;
  }

  /**
   * Finds a user by normalized lowercase email.
   * @param {string} email
   * @returns {Promise<object | null>}
   */
  async findByEmail(email) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  /**
   * Finds a user by unique ID.
   * @param {string} id
   * @returns {Promise<object | null>}
   */
  async findById(id) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Creates a new user record.
   * @param {object} params
   * @param {string} params.name
   * @param {string} params.email
   * @param {string} params.passwordHash
   * @param {'PATIENT' | 'DOCTOR'} [params.role='PATIENT']
   * @returns {Promise<object>}
   */
  async create({ name, email, passwordHash, role = 'PATIENT' }) {
    return this.prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
      },
    });
  }

  /**
   * Deletes a user record by ID (used for test suite cleanup).
   * @param {string} id
   * @returns {Promise<object>}
   */
  async deleteById(id) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}

export const userRepository = new UserRepository();
