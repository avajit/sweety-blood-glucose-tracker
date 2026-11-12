import { httpClient } from './httpClient.js';

/**
 * Fetches clinical report analytics by report type.
 * @param {'daily' | 'month-to-date' | 'monthly'} type
 * @param {object} [params]
 * @param {string} [params.date] - Reference date in YYYY-MM-DD format
 * @param {string} [params.patientId] - Required when requesting as doctor
 * @returns {Promise<object>}
 */
export async function getReport(type, params = {}) {
  const response = await httpClient.get(`/reports/${type}`, { params });
  return response.data;
}
