import crypto from 'node:crypto';

/**
 * Generates a mock Reading record suitable for unit tests and spies.
 *
 * @param {object} [overrides]
 * @returns {object}
 */
export function createMockReading(overrides = {}) {
  const dateStr = overrides.date || overrides.readingDate || '2026-11-10';
  return {
    id: overrides.id || crypto.randomUUID(),
    userId: overrides.userId || 'test-patient-uuid',
    readingDate: new Date(`${dateStr}T00:00:00.000Z`),
    slot: overrides.slot || 'MORNING_FASTING',
    value: overrides.value ?? 110,
    notes: overrides.notes ?? null,
    carbsGrams: overrides.carbsGrams ?? null,
    insulinUnits: overrides.insulinUnits ?? null,
    createdAt: overrides.createdAt || new Date('2026-11-10T08:00:00.000Z'),
    updatedAt: overrides.updatedAt || new Date('2026-11-10T08:00:00.000Z'),
  };
}
