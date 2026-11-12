import { formatDateUtc } from '@sweety/shared/utils/date.js';

/**
 * Maps a Prisma Reading database record into a standardized API response object.
 * Guarantees readingDate is formatted as an ISO calendar date string (YYYY-MM-DD).
 *
 * @param {object} reading - Database record
 * @returns {object | null}
 */
export function toReadingResponse(reading) {
  if (!reading) return null;

  const dateString = reading.readingDate instanceof Date
    ? formatDateUtc(reading.readingDate)
    : String(reading.readingDate).slice(0, 10);

  return {
    id: reading.id,
    userId: reading.userId,
    readingDate: dateString,
    slot: reading.slot,
    value: reading.value,
    notes: reading.notes ?? null,
    carbsGrams: reading.carbsGrams ?? null,
    insulinUnits: reading.insulinUnits ?? null,
    createdAt: reading.createdAt instanceof Date ? reading.createdAt.toISOString() : reading.createdAt,
    updatedAt: reading.updatedAt instanceof Date ? reading.updatedAt.toISOString() : reading.updatedAt,
  };
}
