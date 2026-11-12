import { describe, it, expect } from 'vitest';
import {
  calculateEstimatedA1c,
  calculateTimeInRange,
  getReadingClinicalAssessment,
} from '../../shared/src/utils/clinical.js';
import { CLINICAL_STATUS } from '../../shared/src/constants/clinical.js';
import { SLOTS } from '../../shared/src/constants/slots.js';

describe('QA Phase 4: Clinical Analytics & Mathematical Accuracy Test Suite', () => {
  describe('Estimated HbA1c (eA1c) ADA Formula Verification', () => {
    it('TC-RPT-01A: Calculates eA1c accurately for clinical reference average of 154 mg/dL -> 7.0%', () => {
      // ADA formula: (154 + 46.7) / 28.7 = 200.7 / 28.7 = 6.99303... -> rounds to 7.0%
      const eA1c = calculateEstimatedA1c(154);
      expect(eA1c).toBe(7.0);
    });

    it('TC-RPT-01B: Calculates eA1c accurately for average 120 mg/dL -> 5.8%', () => {
      // (120 + 46.7) / 28.7 = 166.7 / 28.7 = 5.808... -> rounds to 5.8%
      const eA1c = calculateEstimatedA1c(120);
      expect(eA1c).toBe(5.8);
    });

    it('TC-RPT-01C: Calculates eA1c accurately for high average 240 mg/dL -> 10.0%', () => {
      // (240 + 46.7) / 28.7 = 286.7 / 28.7 = 9.9895... -> rounds to 10.0%
      const eA1c = calculateEstimatedA1c(240);
      expect(eA1c).toBe(10.0);
    });

    it('TC-RPT-01D: Handles edge cases: 0, negative numbers, null, NaN gracefully', () => {
      expect(calculateEstimatedA1c(0)).toBeNull();
      expect(calculateEstimatedA1c(-50)).toBeNull();
      expect(calculateEstimatedA1c(null)).toBeNull();
      expect(calculateEstimatedA1c(NaN)).toBeNull();
      expect(calculateEstimatedA1c(undefined)).toBeNull();
    });
  });

  describe('Time In Range (TIR) International Consensus Verification', () => {
    it('TC-RPT-02A: Empty dataset returns zero percentages and zero counts without error', () => {
      const tir = calculateTimeInRange([]);
      expect(tir).toEqual({
        total: 0,
        inRangePct: 0,
        lowPct: 0,
        highPct: 0,
        hypoCount: 0,
        severeHypoCount: 0,
      });
    });

    it('TC-RPT-02B: Correctly classifies exact TIR boundary values', () => {
      // Exact boundaries:
      // Critical Hypo: < 54 (e.g. 53)
      // Warning Hypo: < 70 (e.g. 54, 69)
      // In Target: 70 - 180 (e.g. 70, 120, 180)
      // High: > 180 (e.g. 181, 250, 300)
      const readings = [
        { value: 50 },  // severe hypo (< 54) + hypo (< 70)
        { value: 65 },  // hypo (< 70)
        { value: 70 },  // in range (exactly 70)
        { value: 120 }, // in range
        { value: 180 }, // in range (exactly 180)
        { value: 181 }, // high (> 180)
        { value: 260 }, // high (> 180)
      ];

      const tir = calculateTimeInRange(readings);
      expect(tir.total).toBe(7);
      expect(tir.hypoCount).toBe(2);
      expect(tir.severeHypoCount).toBe(1);
      // In range: 3/7 = 42.857... -> 42.9%
      expect(tir.inRangePct).toBe(42.9);
      // Low: 2/7 = 28.571... -> 28.6%
      expect(tir.lowPct).toBe(28.6);
      // High: 2/7 = 28.571... -> 28.6%
      expect(tir.highPct).toBe(28.6);
    });

    it('TC-RPT-02C: Handles 100% in-target scenario', () => {
      const readings = [{ value: 90 }, { value: 100 }, { value: 110 }, { value: 120 }];
      const tir = calculateTimeInRange(readings);
      expect(tir.inRangePct).toBe(100);
      expect(tir.lowPct).toBe(0);
      expect(tir.highPct).toBe(0);
      expect(tir.hypoCount).toBe(0);
      expect(tir.severeHypoCount).toBe(0);
    });
  });

  describe('Slot-Specific Clinical Assessment Logic', () => {
    it('TC-RPT-03A: Fasting slot thresholds (Fasting max 130 vs Post-Meal max 180)', () => {
      // Fasting: 135 is elevated
      const fastingRes = getReadingClinicalAssessment(135, SLOTS.MORNING_FASTING);
      expect(fastingRes.code).toBe(CLINICAL_STATUS.ELEVATED);
      expect(fastingRes.label).toBe('Elevated Fasting');

      // Post-meal: 135 is normal / in target (< 180)
      const postLunchRes = getReadingClinicalAssessment(135, SLOTS.AFTER_LUNCH);
      expect(postLunchRes.code).toBe(CLINICAL_STATUS.IN_TARGET);
      expect(postLunchRes.label).toBe('In Target');
    });

    it('TC-RPT-03B: Critical Hypoglycemia (< 54 mg/dL) alert generation', () => {
      const res = getReadingClinicalAssessment(50, SLOTS.MORNING_FASTING);
      expect(res.code).toBe(CLINICAL_STATUS.SEVERE_LOW);
      expect(res.color).toBe('red');
      expect(res.alert).toBeDefined();
    });

    it('TC-RPT-03C: Severe Hyperglycemia (> 250 mg/dL) alert generation', () => {
      const res = getReadingClinicalAssessment(255, SLOTS.AFTER_DINNER);
      expect(res.code).toBe(CLINICAL_STATUS.SEVERE_HIGH);
      expect(res.color).toBe('purple');
      expect(res.alert).toBeDefined();
    });
  });
});

