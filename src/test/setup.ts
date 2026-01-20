import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Ensure required env vars exist for server-only modules during tests
// Use SQLite for test isolation (works with @prisma/client-sqlite).
process.env.DATABASE_URL ??= 'file:./test.db';
process.env.DIRECT_URL ??= process.env.DATABASE_URL;

// Cleanup after each test
afterEach(() => {
  cleanup();
});
