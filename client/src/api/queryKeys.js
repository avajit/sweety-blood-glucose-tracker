/**
 * Centralized React Query key factory to prevent cache key divergence across components.
 */
export const queryKeys = Object.freeze({
  auth: {
    me: ['auth', 'me'],
  },
  readings: {
    all: ['readings'],
    list: (params = {}) => ['readings', 'list', params],
    detail: (id) => ['readings', 'detail', id],
  },
  reports: {
    all: ['reports'],
    byType: (type, date, patientId) => ['reports', type, { date, patientId }],
  },
  doctors: {
    patients: ['doctors', 'patients'],
  },
});
