import { CLINICAL_TARGETS, CLINICAL_STATUS, getSlotTargetRange } from '../constants/clinical.js';
import { MESSAGES } from '../constants/messages.js';
import { SLOTS } from '../constants/slots.js';

/**
 * Calculates Estimated A1C (eA1C %) from average blood glucose (mg/dl)
 * using the official ADA formula: eA1C = (average + 46.7) / 28.7
 *
 * @param {number|null} averageGlucose
 * @returns {number|null} eA1C rounded to 1 decimal place, or null if invalid
 */
export function calculateEstimatedA1c(averageGlucose) {
  if (typeof averageGlucose !== 'number' || Number.isNaN(averageGlucose) || averageGlucose <= 0) {
    return null;
  }
  const a1c = (averageGlucose + 46.7) / 28.7;
  return Math.round(a1c * 10) / 10;
}

/**
 * Calculates international standard Time In Range (TIR %) metrics.
 *
 * @param {Array<{ value: number } | number>} readings
 * @returns {{
 *   total: number,
 *   inRangePct: number,
 *   lowPct: number,
 *   highPct: number,
 *   hypoCount: number,
 *   severeHypoCount: number
 * }}
 */
export function calculateTimeInRange(readings) {
  if (!Array.isArray(readings) || readings.length === 0) {
    return {
      total: 0,
      inRangePct: 0,
      lowPct: 0,
      highPct: 0,
      hypoCount: 0,
      severeHypoCount: 0,
    };
  }

  const values = readings.map((r) => (typeof r === 'number' ? r : r.value)).filter((v) => typeof v === 'number');
  const total = values.length;

  if (total === 0) {
    return {
      total: 0,
      inRangePct: 0,
      lowPct: 0,
      highPct: 0,
      hypoCount: 0,
      severeHypoCount: 0,
    };
  }

  let inRangeCount = 0;
  let lowCount = 0;
  let highCount = 0;
  let hypoCount = 0;
  let severeHypoCount = 0;

  for (const v of values) {
    if (v < CLINICAL_TARGETS.TIR_LOW) {
      lowCount++;
      hypoCount++;
      if (v < CLINICAL_TARGETS.HYPO_CRITICAL) {
        severeHypoCount++;
      }
    } else if (v > CLINICAL_TARGETS.TIR_HIGH) {
      highCount++;
    } else {
      inRangeCount++;
    }
  }

  return {
    total,
    inRangePct: Math.round((inRangeCount / total) * 1000) / 10,
    lowPct: Math.round((lowCount / total) * 1000) / 10,
    highPct: Math.round((highCount / total) * 1000) / 10,
    hypoCount,
    severeHypoCount,
  };
}

/**
 * Provides a slot-aware clinical assessment of a blood glucose reading.
 * Fasting targets (80-130) vs Post-meal targets (< 180) are distinguished medically.
 *
 * @param {number} value - Glucose value in mg/dl
 * @param {string} slot - Time slot
 * @returns {{
 *   code: string,
 *   label: string,
 *   color: 'red' | 'rose' | 'green' | 'amber' | 'purple',
 *   alert: string | null,
 *   targetRange: string
 * }}
 */
export function getReadingClinicalAssessment(value, slot) {
  const targetInfo = getSlotTargetRange(slot);

  // 1. Critical Hypoglycemia (< 54 mg/dl)
  if (value < CLINICAL_TARGETS.HYPO_CRITICAL) {
    return {
      code: CLINICAL_STATUS.SEVERE_LOW,
      label: 'Critical Low',
      color: 'red',
      alert: MESSAGES.CLINICAL_SEVERE_LOW,
      targetRange: targetInfo.label,
    };
  }

  // 2. Mild Hypoglycemia (< 70 mg/dl)
  if (value < CLINICAL_TARGETS.HYPO_WARNING) {
    return {
      code: CLINICAL_STATUS.MILD_LOW,
      label: 'Low',
      color: 'rose',
      alert: MESSAGES.CLINICAL_MILD_LOW,
      targetRange: targetInfo.label,
    };
  }

  // 3. Severe Hyperglycemia (> 250 mg/dl)
  if (value > CLINICAL_TARGETS.HYPER_SEVERE) {
    return {
      code: CLINICAL_STATUS.SEVERE_HIGH,
      label: 'Severe High',
      color: 'purple',
      alert: MESSAGES.CLINICAL_SEVERE_HIGH,
      targetRange: targetInfo.label,
    };
  }

  // 4. Slot-specific target checks
  if (slot === SLOTS.MORNING_FASTING) {
    if (value > CLINICAL_TARGETS.FASTING_MAX) {
      return {
        code: CLINICAL_STATUS.ELEVATED,
        label: 'Elevated Fasting',
        color: 'amber',
        alert: null,
        targetRange: targetInfo.label,
      };
    }
    return {
      code: CLINICAL_STATUS.IN_TARGET,
      label: 'In Target',
      color: 'green',
      alert: null,
      targetRange: targetInfo.label,
    };
  }

  // Post-meal slots (AFTER_BREAKFAST, AFTER_LUNCH, AFTER_DINNER)
  if (value > CLINICAL_TARGETS.POST_MEAL_MAX) {
    return {
      code: CLINICAL_STATUS.ELEVATED,
      label: 'Elevated Post-Meal',
      color: 'amber',
      alert: null,
      targetRange: targetInfo.label,
    };
  }

  return {
    code: CLINICAL_STATUS.IN_TARGET,
    label: 'In Target',
    color: 'green',
    alert: null,
    targetRange: targetInfo.label,
  };
}

