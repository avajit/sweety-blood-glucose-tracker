import '@testing-library/jest-dom/vitest';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from '../mocks/server.js';

// Polyfill ResizeObserver for Recharts in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Start MSW mock server before tests run
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

// Reset handlers and unmount React trees between tests
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Clean up MSW server after test suites complete
afterAll(() => {
  server.close();
});
