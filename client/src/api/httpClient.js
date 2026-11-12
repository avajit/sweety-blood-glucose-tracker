import axios from 'axios';
import { ApiError } from './apiError.js';

/**
 * Pre-configured Axios instance for all Sweety REST API calls.
 * Always passes cookies (httpOnly session) and handles normalized error envelopes.
 */
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to unwrap error envelopes { error: { code, message, details } }
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.error) {
      const { code, message, details } = error.response.data.error;
      return Promise.reject(new ApiError(message, code, error.response.status, details || []));
    }

    const fallbackMessage = error.message || 'An unexpected network error occurred.';
    return Promise.reject(new ApiError(fallbackMessage, 'NETWORK_ERROR', error.response?.status || 500));
  },
);
