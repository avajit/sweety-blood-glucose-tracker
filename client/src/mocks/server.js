import { setupServer } from 'msw/node';
import { handlers } from './handlers.js';

/**
 * MSW server instance for Vitest / Node test runner.
 */
export const server = setupServer(...handlers);
