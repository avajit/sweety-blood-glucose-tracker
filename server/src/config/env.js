import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  APP_TIMEZONE: z.string().default('Asia/Kolkata'),
  DATABASE_URL: z.string().min(1).default('postgresql://postgres:password@localhost:5432/sweety'),
  TEST_DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32).default('test_jwt_secret_must_be_at_least_32_characters_long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
  CLIENT_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  ALLOW_DEMO_SEED: z.enum(['true', 'false']).default('false'),
  REDIS_URL: z.string().optional(),
  REMINDER_CRON: z.string().default('0 8 * * *'),
  VAPID_PUBLIC_KEY: z
    .string()
    .default(
      'BMnPHCFdtK8dUvUR7WAQ8X-8X0pDaptqm6Xzjemno4-_OHiUYJ9Xn8ZKvfgL1luo19kqTDo5K8dYo-nTa_Umrrk',
    ),
  VAPID_PRIVATE_KEY: z
    .string()
    .default('99QKx_W57LDFfqqyHk_HVPD8U9Dqf6PhJ7Zikv1qVUk'),
  VAPID_SUBJECT: z.string().default('mailto:support@sweety.local'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment configuration validation failed:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

/**
 * Validated and frozen environment configuration.
 */
export const env = Object.freeze(parsed.data);
