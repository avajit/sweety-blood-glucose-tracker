import { describe, it, expect } from 'vitest';
import {
  calculateEstimatedA1c,
  calculateTimeInRange,
  getReadingClinicalAssessment,
} from './clinical.js';
import { CLINICAL_STATUS } from '../constants/clinical.js';
import { SLOTS } from '../constants/slots.js';

describe('clinical.js utilities', () => {
  describe('calculateEstimatedA1c', () => {
    it('calculates correct eA1C using ADA formula (154 mg/dl -> 7.0%)', () => {
      // (154 + 46.7) / 28.7 = 200.7 / 28.7 = 6.993... -> 7.0
      expect(calculateEstimatedA1c(154)).toBe(7.0);
    });

    it('calculates eA1C for normal average (100 mg/dl -> 5.1%)', () => {
      // (100 + 46.7) / 28.7 = 146.7 / 28.7 = 5.111... -> 5.1
      expect(calculateEstimatedA1c(100)).toBe(5.1);
    });

    it('returns null for null, undefined, or invalid input', () => {
      expect(calculateEstimatedA1c(null)).toBeNull();
      expect(calculateEstimatedA1c(undefined)).toBeNull();
      expect(calculateEstimatedA1c(-50)).toBeNull();
    });
  });

  describe('calculateTimeInRange', () => {
    it('calculates TIR percentages and event counts accurately', () => {
      const readings = [
        { value: 50 },  // Critical Low (< 54)
        { value: 65 },  // Mild Low (54-69)
        { value: 95 },  // In Range (70-180)
        { value: 110 }, // In Range (70-180)
        { value: 130 }, // In Range (70-180)
        { value: 150 }, // In Range (70-180)
        { value: 160 }, // In Range (70-180)
        { value: 175 }, // In Range (70-180)
        { value: 200 }, // High (> 180)
        { value: 260 }, // High (> 180)
      ];

      const tir = calculateTimeInRange(readings);
      expect(tir.total).toBe(10);
      expect(tir.inRangePct).toBe(60.0); // 6 out of 10
      expect(tir.lowPct).toBe(20.0);     // 2 out of 10
      expect(tir.highPct).toBe(20.0);    // 2 out of 10
      expect(tir.hypoCount).toBe(2);
      expect(tir.severeHypoCount).toBe(1);
    });

    it('handles empty readings array safely', () => {
      const tir = calculateTimeInRange([]);
      expect(tir.total).toBe(0);
      expect(tir.inRangePct).toBe(0);
    });
  });

  describe('getReadingClinicalAssessment (Slot-aware ADA assessment)', () => {
    it('detects critical hypoglycemia (< 54 mg/dl) with urgent action alert', () => {
      const assessment = getReadingClinicalAssessment(50, SLOTS.MORNING_FASTING);
      expect(assessment.code).toBe(CLINICAL_STATUS.SEVERE_LOW);
      expect(assessment.color).toBe('red');
      expect(assessment.alert).toContain('Urgent: Blood glucose critically low');
    });

    it('detects mild hypoglycemia (< 70 mg/dl)', () => {
      const assessment = getReadingClinicalAssessment(65, SLOTS.AFTER_LUNCH);
      expect(assessment.code).toBe(CLINICAL_STATUS.MILD_LOW);
      expect(assessment.color).toBe('rose');
    });

    it('evaluates fasting target (80-130 mg/dl): 110 is In Target, 145 is Elevated Fasting', () => {
      const inTarget = getReadingClinicalAssessment(110, SLOTS.MORNING_FASTING);
      expect(inTarget.code).toBe(CLINICAL_STATUS.IN_TARGET);
      expect(inTarget.color).toBe('green');

      const elevated = getReadingClinicalAssessment(145, SLOTS.MORNING_FASTING);
      expect(elevated.code).toBe(CLINICAL_STATUS.ELEVATED);
      expect(elevated.label).toBe('Elevated Fasting');
      expect(elevated.color).toBe('amber');
    });

    it('evaluates post-meal target (< 180 mg/dl): 145 is In Target for After Lunch', () => {
      // Notice: 145 was Elevated for Fasting, but is In Target for After Lunch!
      const postMeal = getReadingClinicalAssessment(145, SLOTS.AFTER_LUNCH);
      expect(postMeal.code).toBe(CLINICAL_STATUS.IN_TARGET);
      expect(postMeal.color).toBe('green');
    });

    it('detects severe hyperglycemia (> 250 mg/dl)', () => {
      const severe = getReadingClinicalAssessment(280, SLOTS.AFTER_DINNER);
      expect(severe.code).toBe(CLINICAL_STATUS.SEVERE_HIGH);
      expect(severe.color).toBe('purple');
      expect(severe.alert).toContain('Severe hyperglycemia');
    });
  });
});

