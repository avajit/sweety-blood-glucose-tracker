import { describe, it, expect } from 'vitest';
import {
  createReadingSchema,
  getCreateReadingSchema,
  updateReadingSchema,
} from './reading.schema.js';
import { MESSAGES } from '../constants/messages.js';

describe('reading.schema.js', () => {
  describe('createReadingSchema', () => {
    it('accepts valid reading payload', () => {
      const payload = {
        date: '2026-11-10',
        slot: 'MORNING_FASTING',
        value: 95,
      };
      const parsed = createReadingSchema.parse(payload);
      expect(parsed).toEqual(payload);
    });

    it('coerces string number to integer value', () => {
      const payload = {
        date: '2026-11-10',
        slot: 'AFTER_LUNCH',
        value: '140',
      };
      const parsed = createReadingSchema.parse(payload);
      expect(parsed.value).toBe(140);
    });

    it('rejects empty string or missing value with "Please enter a glucose value."', () => {
      const emptyStringPayload = {
        date: '2026-11-10',
        slot: 'AFTER_BREAKFAST',
        value: '',
      };
      expect(() => createReadingSchema.parse(emptyStringPayload)).toThrowError(
        MESSAGES.VALUE_REQUIRED,
      );

      const missingPayload = {
        date: '2026-11-10',
        slot: 'AFTER_BREAKFAST',
      };
      expect(() => createReadingSchema.parse(missingPayload)).toThrowError(
        MESSAGES.VALUE_REQUIRED,
      );
    });

    it('rejects value below 40 mg/dl with exact message', () => {
      const payload = {
        date: '2026-11-10',
        slot: 'AFTER_DINNER',
        value: 39,
      };
      expect(() => createReadingSchema.parse(payload)).toThrowError(
        MESSAGES.VALUE_RANGE,
      );
    });

    it('rejects value above 600 mg/dl with exact message', () => {
      const payload = {
        date: '2026-11-10',
        slot: 'AFTER_DINNER',
        value: 601,
      };
      expect(() => createReadingSchema.parse(payload)).toThrowError(
        MESSAGES.VALUE_RANGE,
      );
    });

    it('rejects non-integer value with value range message', () => {
      const payload = {
        date: '2026-11-10',
        slot: 'AFTER_DINNER',
        value: 120.5,
      };
      expect(() => createReadingSchema.parse(payload)).toThrowError(
        MESSAGES.VALUE_RANGE,
      );
    });

    it('rejects invalid slot', () => {
      const payload = {
        date: '2026-11-10',
        slot: 'MIDNIGHT_SNACK',
        value: 110,
      };
      expect(() => createReadingSchema.parse(payload)).toThrowError(
        MESSAGES.SLOT_INVALID,
      );
    });

    it('rejects future date with "Date cannot be in the future." when timezone is bound', () => {
      const schema = getCreateReadingSchema('Asia/Kolkata');
      const payload = {
        date: '2099-12-31',
        slot: 'AFTER_BREAKFAST',
        value: 120,
      };
      expect(() => schema.parse(payload)).toThrowError(MESSAGES.DATE_FUTURE);
    });

    it('accepts valid optional carbohydrates and rapid insulin', () => {
      const payload = {
        date: '2026-11-10',
        slot: 'AFTER_LUNCH',
        value: 130,
        carbsGrams: 45,
        insulinUnits: 5.5,
      };
      const parsed = createReadingSchema.parse(payload);
      expect(parsed.carbsGrams).toBe(45);
      expect(parsed.insulinUnits).toBe(5.5);
    });

    it('rejects carbohydrates outside bounds (0-300) or non-integer', () => {
      expect(() =>
        createReadingSchema.parse({
          date: '2026-11-10',
          slot: 'AFTER_LUNCH',
          value: 130,
          carbsGrams: 301,
        }),
      ).toThrowError('Carbohydrates cannot exceed 300g.');

      expect(() =>
        createReadingSchema.parse({
          date: '2026-11-10',
          slot: 'AFTER_LUNCH',
          value: 130,
          carbsGrams: -1,
        }),
      ).toThrowError('Carbohydrates cannot be negative.');

      expect(() =>
        createReadingSchema.parse({
          date: '2026-11-10',
          slot: 'AFTER_LUNCH',
          value: 130,
          carbsGrams: 45.5,
        }),
      ).toThrowError('Carbohydrates must be a whole number.');
    });

    it('rejects insulin units outside bounds (0-100)', () => {
      expect(() =>
        createReadingSchema.parse({
          date: '2026-11-10',
          slot: 'AFTER_LUNCH',
          value: 130,
          insulinUnits: 101,
        }),
      ).toThrowError('Insulin units cannot exceed 100u.');

      expect(() =>
        createReadingSchema.parse({
          date: '2026-11-10',
          slot: 'AFTER_LUNCH',
          value: 130,
          insulinUnits: -0.5,
        }),
      ).toThrowError('Insulin units cannot be negative.');
    });
  });

  describe('updateReadingSchema', () => {
    it('accepts partial update with single field', () => {
      const parsed = updateReadingSchema.parse({ value: 115 });
      expect(parsed).toEqual({ value: 115 });
    });

    it('rejects empty object when no fields are supplied', () => {
      expect(() => updateReadingSchema.parse({})).toThrow();
    });
  });
});
