import { ROLES } from '@sweety/shared/constants/roles.js';

export function createMockUser(overrides = {}) {
  return {
    id: overrides.id || 'patient-uuid-1',
    name: overrides.name || 'Alice Walker',
    email: overrides.email || 'alice@example.com',
    role: overrides.role || ROLES.PATIENT,
  };
}

export function createMockReading(overrides = {}) {
  return {
    id: overrides.id || 'reading-uuid-1',
    userId: overrides.userId || 'patient-uuid-1',
    readingDate: overrides.readingDate || '2026-11-10',
    slot: overrides.slot || 'MORNING_FASTING',
    value: overrides.value ?? 110,
    notes: overrides.notes ?? null,
    createdAt: overrides.createdAt || new Date().toISOString(),
    updatedAt: overrides.updatedAt || new Date().toISOString(),
  };
}
