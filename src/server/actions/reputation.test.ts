import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getReputationAction } from './reputation';
import * as queries from '@/lib/db/queries';
import * as calculator from '@/lib/scoring/calculator';

vi.mock('@/lib/db/queries');
vi.mock('@/lib/scoring/calculator');

describe('getReputationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return reputation data successfully', async () => {
    const mockUser = {
      id: 'user-1',
      primaryAddress: '0x1234567890123456789012345678901234567890',
      wallets: [],
      reputation: null,
    };

    const mockReputationData = {
      totalScore: 750,
      tier: 'BUILDER' as const,
      metrics: [],
      lastCalculated: new Date(),
    };

    vi.mocked(queries.getUserByAddress).mockResolvedValue(mockUser);
    vi.mocked(calculator.calculateReputation).mockResolvedValue(mockReputationData);
    vi.mocked(queries.upsertReputation).mockResolvedValue({} as any);

    const result = await getReputationAction('0x1234567890123456789012345678901234567890');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockReputationData);
    expect(queries.upsertReputation).toHaveBeenCalledWith(mockUser.id, mockReputationData);
  });

  it('should create user if not exists', async () => {
    const mockUser = {
      id: 'user-1',
      primaryAddress: '0x1234567890123456789012345678901234567890',
      wallets: [],
      reputation: null,
    };

    const mockReputationData = {
      totalScore: 500,
      tier: 'RESIDENT' as const,
      metrics: [],
      lastCalculated: new Date(),
    };

    vi.mocked(queries.getUserByAddress).mockResolvedValueOnce(null);
    vi.mocked(queries.createUser).mockResolvedValue(mockUser);
    vi.mocked(calculator.calculateReputation).mockResolvedValue(mockReputationData);
    vi.mocked(queries.upsertReputation).mockResolvedValue({} as any);

    const result = await getReputationAction('0x1234567890123456789012345678901234567890');

    expect(queries.createUser).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('should return error for invalid address', async () => {
    const result = await getReputationAction('invalid-address');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle calculation errors', async () => {
    const mockUser = {
      id: 'user-1',
      primaryAddress: '0x1234567890123456789012345678901234567890',
      wallets: [],
      reputation: null,
    };

    vi.mocked(queries.getUserByAddress).mockResolvedValue(mockUser);
    vi.mocked(calculator.calculateReputation).mockRejectedValue(new Error('Calculation failed'));

    const result = await getReputationAction('0x1234567890123456789012345678901234567890');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Calculation failed');
  });
});
