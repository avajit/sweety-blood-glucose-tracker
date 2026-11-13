/**
 * Centralized user-facing error and notification messages.
 * Note: Hard requirement — error messages live ONLY in this file.
 */
export const MESSAGES = Object.freeze({
  // Clinical blood glucose reading validation specifications
  VALUE_REQUIRED: 'Please enter a glucose value.',
  VALUE_RANGE: 'Value must be between 40 and 600 mg/dl.',
  DAILY_LIMIT_EXCEEDED: 'You can add only 4 readings per day.',
  DATE_FUTURE: 'Date cannot be in the future.',
  DATE_REQUIRED: 'Date is required.',
  DATE_INVALID: 'Date must be a valid date in YYYY-MM-DD format.',
  SLOT_REQUIRED: 'Time slot is required.',
  SLOT_INVALID: 'Invalid time slot selected.',

  /**
   * Generates duplicate slot message using the slot label.
   * Example: "You already have an After lunch reading for this date."
   * @param {string} slotLabel
   * @returns {string}
   */
  duplicateSlot: (slotLabel) => `You already have an ${slotLabel} reading for this date.`,

  // Authentication validation & errors
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  AUTH_EMAIL_TAKEN: 'Email already registered',
  AUTH_UNAUTHORIZED: 'Authentication required',
  AUTH_FORBIDDEN: 'Access forbidden',
  AUTH_NAME_REQUIRED: 'Name is required.',
  AUTH_EMAIL_REQUIRED: 'Email is required.',
  AUTH_EMAIL_INVALID: 'Please enter a valid email address.',
  AUTH_PASSWORD_REQUIRED: 'Password is required.',
  AUTH_PASSWORD_MIN: 'Password must be at least 8 characters.',

  // Rate limiting messages
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later.',
  RATE_LIMIT_AUTH_EXCEEDED: 'Too many attempts from this IP, please try again after 15 minutes.',

  // Reports
  REPORT_TYPE_INVALID: 'Invalid report type. Allowed types: daily, month-to-date, monthly.',
  REPORT_EMPTY: 'No readings recorded for this period.',

  // Generic errors
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  CSRF_FORBIDDEN: 'Origin not allowed',

  // Clinical alerts (ADA Standards of Care)
  CLINICAL_SEVERE_LOW: 'Urgent: Blood glucose critically low. Consume 15g fast-acting carbohydrates immediately and retest in 15 minutes.',
  CLINICAL_MILD_LOW: 'Warning: Low blood sugar. Have a fast-acting snack or carbohydrates.',
  CLINICAL_SEVERE_HIGH: 'Warning: Severe hyperglycemia. Stay hydrated and consult physician if persistent.',
});
