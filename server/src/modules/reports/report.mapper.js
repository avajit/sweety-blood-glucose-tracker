import { formatDateUtc } from '@sweety/shared/utils/date.js';
import { calculateEstimatedA1c, calculateTimeInRange } from '@sweety/shared/utils/clinical.js';

/**
 * Maps a Reading database record into a clean report reading item.
 *
 * @param {object} reading
 * @returns {object}
 */
export function toReportReading(reading) {
  const dateString = reading.readingDate instanceof Date
    ? formatDateUtc(reading.readingDate)
    : String(reading.readingDate).slice(0, 10);

  return {
    id: reading.id,
    slot: reading.slot,
    value: reading.value,
    notes: reading.notes ?? null,
    readingDate: dateString,
    createdAt: reading.createdAt instanceof Date ? reading.createdAt.toISOString() : reading.createdAt,
    updatedAt: reading.updatedAt instanceof Date ? reading.updatedAt.toISOString() : reading.updatedAt,
  };
}

/**
 * Formats aggregated stats and readings into a standardized clinical report response.
 *
 * @param {object} params
 * @param {string} params.type - Report type (daily, month-to-date, monthly)
 * @param {{ from: string, to: string }} params.range - Date range
 * @param {number} params.count - Total readings count
 * @param {number | null} params.highest - Maximum glucose value
 * @param {number | null} params.lowest - Minimum glucose value
 * @param {number | null} params.average - Average glucose value (rounded)
 * @param {object[]} params.readings - Raw reading records
 * @returns {object}
 */
export function toReportResponse({ type, range, count, highest, lowest, average, readings }) {
  const formattedReadings = (readings || []).map(toReportReading);
  const estimatedA1c = average !== null ? calculateEstimatedA1c(average) : null;
  const timeInRange = calculateTimeInRange(readings || []);

  return {
    type,
    range,
    count,
    highest,
    lowest,
    average,
    estimatedA1c,
    timeInRange,
    readings: formattedReadings,
  };
}
