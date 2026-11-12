import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

// Precomputed bcrypt cost-12 hash used for timing attack mitigation when email does not exist
const DUMMY_HASH = '$2a$12$e8n0V1.hQ3cZ9QcK9CgPwe0f5rYt8X6r3I0t0k7.w9l0n7a8b9c1e';

/**
 * Hashes a plaintext password using bcrypt with 12 salt rounds.
 * @param {string} password - The plaintext password to hash
 * @returns {Promise<string>} The hashed password string
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 * @param {string} password - The plaintext candidate password
 * @param {string} hash - The bcrypt hash to verify against
 * @returns {Promise<boolean>} True if password matches hash, false otherwise
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Executes a dummy hash comparison to defend against timing side-channel attacks.
 * Ensures the response time is indistinguishable when an email is not found.
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export async function dummyCompare(password) {
  return bcrypt.compare(password, DUMMY_HASH);
}
