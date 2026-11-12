import { httpClient } from './httpClient.js';

/**
 * Fetches paginated readings with optional date/slot filters.
 * @param {object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @param {string} [params.from]
 * @param {string} [params.to]
 * @param {string} [params.slot]
 * @returns {Promise<{ data: Array<object>, pagination: object }>}
 */
export async function getReadings(params = {}) {
  const response = await httpClient.get('/readings', { params });
  return response.data;
}

/**
 * Fetches a single reading by ID.
 * @param {string} id
 * @returns {Promise<{ data: object }>}
 */
export async function getReadingById(id) {
  const response = await httpClient.get(`/readings/${id}`);
  return response.data;
}

/**
 * Creates a new blood glucose reading.
 * @param {object} payload
 * @param {number} payload.value
 * @param {string} payload.slot
 * @param {string} payload.date
 * @param {string} [payload.notes]
 * @returns {Promise<{ data: object }>}
 */
export async function createReading(payload) {
  const response = await httpClient.post('/readings', payload);
  return response.data;
}

/**
 * Updates an existing blood glucose reading.
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<{ data: object }>}
 */
export async function updateReading(id, payload) {
  const response = await httpClient.patch(`/readings/${id}`, payload);
  return response.data;
}

/**
 * Deletes a blood glucose reading by ID.
 * @param {string} id
 * @returns {Promise<{ message: string }>}
 */
export async function deleteReading(id) {
  const response = await httpClient.delete(`/readings/${id}`);
  return response.data;
}
