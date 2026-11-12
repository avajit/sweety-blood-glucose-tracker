import { z } from 'zod';
import { MESSAGES } from '../constants/messages.js';
import { LIMITS } from '../constants/limits.js';

/**
 * Registration request schema.
 * Note: Hard security rule — NEVER accepts 'role' or 'userId' from the client.
 */
export const registerSchema = z
  .object({
    name: z
      .string({ required_error: MESSAGES.AUTH_NAME_REQUIRED })
      .trim()
      .min(1, MESSAGES.AUTH_NAME_REQUIRED),
    email: z
      .string({ required_error: MESSAGES.AUTH_EMAIL_REQUIRED })
      .trim()
      .toLowerCase()
      .email(MESSAGES.AUTH_EMAIL_INVALID),
    password: z
      .string({ required_error: MESSAGES.AUTH_PASSWORD_REQUIRED })
      .min(LIMITS.PASSWORD_MIN_LENGTH, MESSAGES.AUTH_PASSWORD_MIN),
  })
  .strip(); // Security rule: strips unexpected extra fields such as 'role' or 'userId'

/**
 * Login request schema.
 */
export const loginSchema = z
  .object({
    email: z
      .string({ required_error: MESSAGES.AUTH_EMAIL_REQUIRED })
      .trim()
      .toLowerCase()
      .email(MESSAGES.AUTH_EMAIL_INVALID),
    password: z
      .string({ required_error: MESSAGES.AUTH_PASSWORD_REQUIRED })
      .min(1, MESSAGES.AUTH_PASSWORD_REQUIRED),
  })
  .strip();
