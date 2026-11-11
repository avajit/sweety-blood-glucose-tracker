/**
 * Application numerical limits, constraints, and defaults.
 * Centralized to guarantee zero hardcoded numbers across client and server.
 */
export const LIMITS = Object.freeze({
  // Glucose reading limits (mg/dl)
  VALUE_MIN: 40,
  VALUE_MAX: 600,
  READINGS_PER_DAY_MAX: 4,
  GLUCOSE_UNIT: 'mg/dl',

  // Pagination defaults and constraints
  PAGE_DEFAULT: 1,
  PAGE_LIMIT_DEFAULT: 20,
  PAGE_LIMIT_MAX: 100,

  // Auth password constraints
  PASSWORD_MIN_LENGTH: 8,

  // Timezone default fallback
  DEFAULT_APP_TIMEZONE: 'Asia/Kolkata',

  // Rate limiting (requests per window)
  RATE_LIMIT: Object.freeze({
    // General API rate limit: 100 requests per 15 minutes
    API_WINDOW_MS: 15 * 60 * 1000,
    API_MAX: 100,

    // Strict Auth rate limit: 5 requests per 15 minutes (login/register)
    AUTH_WINDOW_MS: 15 * 60 * 1000,
    AUTH_MAX: 5,
  }),
});
