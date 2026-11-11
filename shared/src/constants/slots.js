/**
 * Blood glucose reading time slots.
 */
export const SLOTS = Object.freeze({
  MORNING_FASTING: 'MORNING_FASTING',
  AFTER_BREAKFAST: 'AFTER_BREAKFAST',
  AFTER_LUNCH: 'AFTER_LUNCH',
  AFTER_DINNER: 'AFTER_DINNER',
});

/**
 * Array of all valid slot enum values.
 */
export const SLOT_VALUES = Object.freeze([
  SLOTS.MORNING_FASTING,
  SLOTS.AFTER_BREAKFAST,
  SLOTS.AFTER_LUNCH,
  SLOTS.AFTER_DINNER,
]);

/**
 * Human-readable labels for each slot.
 */
export const SLOT_LABELS = Object.freeze({
  [SLOTS.MORNING_FASTING]: 'Morning fasting',
  [SLOTS.AFTER_BREAKFAST]: 'After breakfast',
  [SLOTS.AFTER_LUNCH]: 'After lunch',
  [SLOTS.AFTER_DINNER]: 'After dinner',
});

/**
 * Returns human-readable label for a slot.
 * @param {string} slot
 * @returns {string}
 */
export function getSlotLabel(slot) {
  return SLOT_LABELS[slot] || slot;
}
