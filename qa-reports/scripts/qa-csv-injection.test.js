import { describe, it, expect } from 'vitest';
import { generateReadingsCsv, escapeCsvCell } from '../../client/src/utils/csvExport.js';

describe('QA Phase 4 & 6: CSV Export & Formula Injection Security Audit', () => {
  it('TC-CSV-01: Generates valid RFC 4180 CSV with standard medical headers', () => {
    const sampleReadings = [
      {
        date: '2026-11-12',
        slot: 'MORNING_FASTING',
        value: 105,
        carbsGrams: 0,
        insulinUnits: 0,
        notes: 'Fasting test',
      },
    ];

    const csv = generateReadingsCsv(sampleReadings);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Date,Clinical Slot,Glucose Level (mg/dL),ADA Clinical Status,Carbs (g),Insulin (u),Notes');
    expect(lines[1]).toContain('2026-11-12');
    expect(lines[1]).toContain('105');
  });

  it('TC-CSV-02 (DEFECT AUDIT): Probes CSV Formula Injection (CWE-1236)', () => {
    // Attack payloads that can trigger formula execution or DDE in Excel/Calc:
    // Leading '=', '+', '-', '@', '\t', '\r'
    const dangerousPayloads = [
      "=cmd|' /C calc'!A0",
      '@SUM(1+1)',
      '+100-50',
      '-2+3',
      '=1+1',
    ];

    const testReadings = dangerousPayloads.map((payload, idx) => ({
      date: '2026-11-12',
      slot: 'MORNING_FASTING',
      value: 100 + idx,
      notes: payload,
    }));

    const _csv = generateReadingsCsv(testReadings);
    
    // Check if any line contains raw unescaped formula triggers at the beginning of a cell
    // A secure implementation prepends a single quote "'" or tab if a cell begins with =, +, -, @
    for (const payload of dangerousPayloads) {
      const escaped = escapeCsvCell(payload);
      // In current implementation: does it prepend "'" or does it pass through verbatim?
      console.log(`[CSV Probe] Input: "${payload}" -> Output: "${escaped}"`);
    }

    // Notice: escapeCsvCell safely neutralizes formula prefixes with a prepended single quote (')
    expect(escapeCsvCell('=1+1')).toBe(`"'=1+1"`);
    expect(escapeCsvCell('@SUM(1+1)')).toBe(`"'@SUM(1+1)"`);
    expect(escapeCsvCell('+100-50')).toBe(`"'+100-50"`);
  });
});

