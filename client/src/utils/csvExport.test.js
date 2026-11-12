import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  escapeCsvCell,
  getClinicalStatusLabel,
  generateReadingsCsv,
  downloadReadingsCsv,
} from './csvExport.js';
import { SLOTS } from '@sweety/shared/constants/slots.js';

describe('CSV Export Utility (Phase 1)', () => {
  describe('escapeCsvCell', () => {
    it('returns empty string for null and undefined', () => {
      expect(escapeCsvCell(null)).toBe('');
      expect(escapeCsvCell(undefined)).toBe('');
    });

    it('returns plain string without quotes when no special characters exist', () => {
      expect(escapeCsvCell('Fasting')).toBe('Fasting');
      expect(escapeCsvCell(120)).toBe('120');
    });

    it('escapes cells containing commas by wrapping in double quotes', () => {
      expect(escapeCsvCell('High reading, after pizza')).toBe('"High reading, after pizza"');
    });

    it('escapes double quotes by doubling them and wrapping in quotes', () => {
      expect(escapeCsvCell('Felt "shaky" and weak')).toBe('"Felt ""shaky"" and weak"');
    });

    it('escapes cells containing newlines', () => {
      expect(escapeCsvCell("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
    });
  });

  describe('getClinicalStatusLabel', () => {
    it('categorizes < 54 as Critical Low (Level 2)', () => {
      expect(getClinicalStatusLabel(50)).toBe('Critical Low (Level 2)');
    });

    it('categorizes 55–69 as Low (Level 1)', () => {
      expect(getClinicalStatusLabel(65)).toBe('Low (Level 1)');
    });

    it('categorizes 70–180 as In Target (Normal)', () => {
      expect(getClinicalStatusLabel(110)).toBe('In Target (Normal)');
      expect(getClinicalStatusLabel(70)).toBe('In Target (Normal)');
      expect(getClinicalStatusLabel(180)).toBe('In Target (Normal)');
    });

    it('categorizes 181–250 as Elevated', () => {
      expect(getClinicalStatusLabel(195)).toBe('Elevated');
    });

    it('categorizes > 250 as Severe High', () => {
      expect(getClinicalStatusLabel(280)).toBe('Severe High');
    });
  });

  describe('generateReadingsCsv', () => {
    it('generates headers only when readings array is empty', () => {
      const csv = generateReadingsCsv([]);
      expect(csv).toBe('Date,Clinical Slot,Glucose Level (mg/dL),ADA Clinical Status,Carbs (g),Insulin (u),Notes');
    });

    it('generates formatted rows with proper slots, correlates and clinical labels', () => {
      const readings = [
        {
          date: '2026-10-15',
          slot: SLOTS.MORNING_FASTING,
          value: 105,
          carbsGrams: null,
          insulinUnits: null,
          notes: 'Felt great',
        },
        {
          date: '2026-10-15',
          slot: SLOTS.AFTER_LUNCH,
          value: 195,
          carbsGrams: 60,
          insulinUnits: 5.5,
          notes: 'Large meal, with dessert',
        },
      ];

      const csv = generateReadingsCsv(readings);
      const lines = csv.split('\r\n');

      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('Date,Clinical Slot,Glucose Level (mg/dL),ADA Clinical Status,Carbs (g),Insulin (u),Notes');
      expect(lines[1]).toBe('2026-10-15,Morning fasting,105,In Target (Normal),,,Felt great');
      expect(lines[2]).toBe('2026-10-15,After lunch,195,Elevated,60,5.5,"Large meal, with dessert"');
    });
  });

  describe('downloadReadingsCsv', () => {
    let originalCreateObjectURL;
    let originalRevokeObjectURL;

    beforeEach(() => {
      originalCreateObjectURL = window.URL.createObjectURL;
      originalRevokeObjectURL = window.URL.revokeObjectURL;

      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      window.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      window.URL.createObjectURL = originalCreateObjectURL;
      window.URL.revokeObjectURL = originalRevokeObjectURL;
      vi.restoreAllMocks();
    });

    it('creates an anchor element and clicks it to trigger download', () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      const readings = [{ date: '2026-10-15', slot: SLOTS.MORNING_FASTING, value: 95, notes: '' }];
      const result = downloadReadingsCsv(readings, 'test-export.csv');

      expect(result).toContain('95');
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});
