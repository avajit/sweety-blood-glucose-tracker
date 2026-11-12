import { httpClient } from './httpClient.js';

/**
 * Fetches the list of all patients linked to the authenticated doctor.
 *
 * @returns {Promise<Array<{ id: string, name: string, email: string }>>}
 */
export async function getDoctorPatients() {
  const response = await httpClient.get('/doctor/patients');
  return response.data.data;
}
