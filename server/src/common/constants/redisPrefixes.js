/**
 * Redis key namespace prefixes to avoid key collisions.
 */
export const REDIS_PREFIXES = Object.freeze({
  REPORTS: 'sweety:reports',
  RATE_LIMIT: 'sweety:rl',
  REMINDERS: 'sweety:reminders',
});
