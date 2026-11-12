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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor with automatic Refresh Token Rotation
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401, not already retried, and not an auth mutation route
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => httpClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await httpClient.post('/auth/refresh');
        processQueue(null);
        return httpClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.data?.error) {
      const { code, message, details } = error.response.data.error;
      return Promise.reject(new ApiError(message, code, error.response.status, details || []));
    }

    const fallbackMessage = error.message || 'An unexpected network error occurred.';
    return Promise.reject(new ApiError(fallbackMessage, 'NETWORK_ERROR', error.response?.status || 500));
  },
);
