import supertest from 'supertest';
import { createApp } from '../../src/app.js';

/**
 * Creates an isolated supertest agent configured with the application factory.
 * @returns {import('supertest').SuperTest<import('supertest').Test>}
 */
export function createTestAgent() {
  const app = createApp();
  return supertest(app);
}
