import { httpClient } from './httpClient.js';

export const authApi = {
  /**
   * Registers a new patient.
   * @param {{ name: string, email: string, password: string }} payload
   * @returns {Promise<object>} User object
   */
  async register(payload) {
    const { data } = await httpClient.post('/auth/register', payload);
    return data;
  },

  /**
   * Authenticates user and sets session cookie.
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<object>} User object
   */
  async login(credentials) {
    const { data } = await httpClient.post('/auth/login', credentials);
    return data;
  },

  /**
   * Clears session cookie on backend.
   * @returns {Promise<void>}
   */
  async logout() {
    await httpClient.post('/auth/logout');
  },

  /**
   * Hydrates active session from session cookie.
   * @returns {Promise<object>} User object
   */
  async getMe() {
    const { data } = await httpClient.get('/auth/me');
    return data;
  },
};
