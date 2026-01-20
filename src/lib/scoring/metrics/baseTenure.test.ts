import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateBaseTenure } from './baseTenure';
import type { ScoreInput } from '@/types/reputation';
import * as queries from '@/lib/db/queries';
import * as baseClient from '@/lib/chain/base-client';

vi.mock('@/lib/db/queries');
vi.mock('@/lib/chain/base-client');

describe('calculateBaseTenure', () => {
  const mockInput: ScoreInput = {
    address: '0x1234567890123456789012345678901234567890',
    linkedWallets: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return correct structure', async () => {
    const mockCache = {
      firstTxTimestamp: Math.floor(Date.now() / 1000) - 86400 * 30, // 30 days ago
      transactionCount: 10,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    };

    vi.mocked(queries.getTransactionCache).mockResolvedValue(mockCache as any);

    const result = await calculateBaseTenure(mockInput);

    expect(result).toHaveProperty('name', 'Base Tenure');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('weight', 15);
    expect(result).toHaveProperty('maxScore', 150);
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(150);
  });

  it('should return zero score for new wallet', async () => {
    vi.mocked(queries.getTransactionCache).mockResolvedValue(null);

    const result = await calculateBaseTenure(mockInput);

    expect(result.score).toBe(0);
  });

  it('should calculate score based on transaction timestamp', async () => {
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 86400 * 30;
    const mockCache = {
      firstTxTimestamp: thirtyDaysAgo,
      transactionCount: 10,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    };

    vi.mocked(queries.getTransactionCache).mockResolvedValue(mockCache as any);

    const result = await calculateBaseTenure(mockInput);

    // 30 days should give some score (not zero, not max)
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(150);
  });

  it('should handle cached data correctly', async () => {
    const oneYearAgo = Math.floor(Date.now() / 1000) - 86400 * 365;
    const mockCache = {
      firstTxTimestamp: oneYearAgo,
      transactionCount: 100,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    };

    vi.mocked(queries.getTransactionCache).mockResolvedValue(mockCache as any);

    const result = await calculateBaseTenure(mockInput);

    // 1 year should give higher score than 30 days
    expect(result.score).toBeGreaterThan(0);
  });

  it('should include linked wallets in calculation', async () => {
    const inputWithLinked: ScoreInput = {
      ...mockInput,
      linkedWallets: ['0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'],
    };

    vi.mocked(queries.getTransactionCache).mockResolvedValue(null);

    await calculateBaseTenure(inputWithLinked);

    // Should check cache for linked wallets too
    expect(queries.getTransactionCache).toHaveBeenCalledTimes(
      1 + inputWithLinked.linkedWallets.length
    );
  });
});
