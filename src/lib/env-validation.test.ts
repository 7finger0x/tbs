import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateEnvironment, getRequiredEnv, getOptionalEnv } from './env-validation';

describe('validateEnvironment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should validate required environment variables', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    const result = validateEnvironment();

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when required variable is missing', () => {
    delete process.env.DATABASE_URL;

    const result = validateEnvironment();

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('DATABASE_URL');
  });

  it('should fail when required variable is invalid', () => {
    process.env.DATABASE_URL = 'invalid://url';

    const result = validateEnvironment();

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('DATABASE_URL'))).toBe(true);
  });

  it('should warn about missing optional variables', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    delete process.env.NEYNAR_API_KEY;

    const result = validateEnvironment();

    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes('NEYNAR_API_KEY'))).toBe(true);
  });

  it('should not warn about optional variables with defaults', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    delete process.env.NEXT_PUBLIC_BASE_RPC_URL;

    const result = validateEnvironment();

    expect(result.valid).toBe(true);
    // Should not warn about variables with defaults
    expect(result.warnings.some((w) => w.includes('NEXT_PUBLIC_BASE_RPC_URL'))).toBe(false);
  });
});

describe('getRequiredEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return environment variable value', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    const value = getRequiredEnv('DATABASE_URL');

    expect(value).toBe('postgresql://localhost:5432/test');
  });

  it('should throw error when variable is missing', () => {
    delete process.env.DATABASE_URL;

    expect(() => getRequiredEnv('DATABASE_URL')).toThrow();
  });
});

describe('getOptionalEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return environment variable value', () => {
    process.env.TEST_VAR = 'test-value';

    const value = getOptionalEnv('TEST_VAR');

    expect(value).toBe('test-value');
  });

  it('should return default value when variable is missing', () => {
    delete process.env.TEST_VAR;

    const value = getOptionalEnv('TEST_VAR', 'default-value');

    expect(value).toBe('default-value');
  });

  it('should return empty string when variable is missing and no default', () => {
    delete process.env.TEST_VAR;

    const value = getOptionalEnv('TEST_VAR');

    expect(value).toBe('');
  });
});
