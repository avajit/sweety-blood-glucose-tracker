import { formatSlot } from '../lib/format.js';
import { CLINICAL_TARGETS } from '@sweety/shared/constants/clinical.js';

/**
 * Categorizes a glucose value into clinical status for CSV.
 * @param {number} value
 * @returns {string}
 */
export function getClinicalStatusLabel(value) {
  if (value < CLINICAL_TARGETS.HYPO_CRITICAL) return 'Critical Low (Level 2)';
  if (value < CLINICAL_TARGETS.HYPO_WARNING) return 'Low (Level 1)';
  if (value > CLINICAL_TARGETS.HYPER_SEVERE) return 'Severe High';
  if (value > CLINICAL_TARGETS.HYPER_ELEVATED) return 'Elevated';
  return 'In Target (Normal)';
}

/**
 * Escapes a cell value according to RFC 4180 CSV standard.
 * @param {any} value
 * @returns {string}
 */
export function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates CSV string from readings array.
 * @param {Array<{ date: string, slot: string, value: number, carbsGrams?: number, insulinUnits?: number, notes?: string }>} readings
 * @returns {string}
 */
export function generateReadingsCsv(readings = []) {
  const headers = [
    'Date',
    'Clinical Slot',
    'Glucose Level (mg/dL)',
    'ADA Clinical Status',
    'Carbs (g)',
    'Insulin (u)',
    'Notes',
  ];
  const rows = readings.map((r) => [
    escapeCsvCell(r.date),
    escapeCsvCell(formatSlot(r.slot)),
    escapeCsvCell(r.value),
    escapeCsvCell(getClinicalStatusLabel(r.value)),
    escapeCsvCell(r.carbsGrams != null ? r.carbsGrams : ''),
    escapeCsvCell(r.insulinUnits != null ? r.insulinUnits : ''),
    escapeCsvCell(r.notes || ''),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
}

/**
 * Triggers browser download of readings CSV.
 * @param {Array<object>} readings
 * @param {string} [filename]
 * @returns {string} The generated CSV content
 */
export function downloadReadingsCsv(
  readings = [],
  filename = `sweety-glucose-readings-${new Date().toISOString().slice(0, 10)}.csv`
) {
  const csvContent = generateReadingsCsv(readings);

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return csvContent;
}

