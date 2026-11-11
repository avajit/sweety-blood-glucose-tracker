import { SLOTS } from './slots.js';

/**
 * Clinical Blood Glucose Targets and Alert Thresholds
 * Based on American Diabetes Association (ADA) Standards of Care.
 */
export const CLINICAL_TARGETS = Object.freeze({
  // Hypoglycemia Levels
  HYPO_CRITICAL: 54, // Level 2: Clinically significant severe hypoglycemia (< 54 mg/dl)
  HYPO_WARNING: 70,  // Level 1: Hypoglycemia (< 70 mg/dl)

  // Hyperglycemia Levels
  HYPER_ELEVATED: 180, // Post-meal elevated (> 180 mg/dl)
  HYPER_SEVERE: 250,   // Severe hyperglycemia / DKA warning zone (> 250 mg/dl)

  // Target ranges by slot
  FASTING_MIN: 80,
  FASTING_MAX: 130, // ADA Fasting / Pre-prandial target: 80 - 130 mg/dl
  POST_MEAL_MAX: 180, // ADA Post-prandial target: < 180 mg/dl

  // Time In Range (TIR) International Consensus Boundaries (mg/dl)
  TIR_LOW: 70,
  TIR_HIGH: 180,
});

/**
 * Clinical status codes and presentation metadata.
 */
export const CLINICAL_STATUS = Object.freeze({
  SEVERE_LOW: 'SEVERE_LOW',
  MILD_LOW: 'MILD_LOW',
  IN_TARGET: 'IN_TARGET',
  ELEVATED: 'ELEVATED',
  SEVERE_HIGH: 'SEVERE_HIGH',
});

/**
 * Returns slot-specific expected target range description.
 * @param {string} slot
 * @returns {{ min: number, max: number, label: string }}
 */
export function getSlotTargetRange(slot) {
  if (slot === SLOTS.MORNING_FASTING) {
    return {
      min: CLINICAL_TARGETS.FASTING_MIN,
      max: CLINICAL_TARGETS.FASTING_MAX,
      label: '80–130 mg/dl (Fasting target)',
    };
  }
  return {
    min: CLINICAL_TARGETS.HYPO_WARNING,
    max: CLINICAL_TARGETS.POST_MEAL_MAX,
    label: '70–180 mg/dl (Post-meal target)',
  };
}

