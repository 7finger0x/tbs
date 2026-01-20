import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeAddress } from '@/lib/utils';
import type { Address } from 'viem';
import type { ReputationData } from '@/types/reputation';
import {
  getUserByAddress,
  createUser,
  linkWallet,
  upsertReputation,
} from './queries';
import { prisma } from './index';

vi.mock('./index', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    wallet: {
      create: vi.fn(),
    },
    reputation: {
      upsert: vi.fn(),
    },
  },
}));

describe('Database Queries', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as Address;
  const normalizedAddress = normalizeAddress(mockAddress);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserByAddress', () => {
    it('should return user with normalized address', async () => {
      const mockUser = {
        id: 'user-1',
        primaryAddress: normalizedAddress,
        wallets: [],
        reputation: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await getUserByAddress(mockAddress);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { primaryAddress: normalizedAddress },
        include: {
          wallets: true,
          reputation: true,
        },
      });
    });

    it('should normalize address before query', async () => {
      const uppercaseAddress = mockAddress.toUpperCase() as Address;

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await getUserByAddress(uppercaseAddress);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { primaryAddress: normalizedAddress },
        include: {
          wallets: true,
          reputation: true,
        },
      });
    });
  });

  describe('createUser', () => {
    it('should create user with normalized address', async () => {
      const mockUser = {
        id: 'user-1',
        primaryAddress: normalizedAddress,
        wallets: [],
        reputation: null,
      };

      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      const result = await createUser(mockAddress);

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          primaryAddress: normalizedAddress,
        },
      });
    });
  });

  describe('linkWallet', () => {
    it('should create wallet link with normalized address', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        address: normalizedAddress,
        signature: '0xsignature',
        linkedAt: new Date(),
      };

      vi.mocked(prisma.wallet.create).mockResolvedValue(mockWallet as any);

      const result = await linkWallet('user-1', mockAddress, '0xsignature');

      expect(result).toEqual(mockWallet);
      expect(prisma.wallet.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          address: normalizedAddress,
          signature: '0xsignature',
        },
      });
    });
  });

  describe('upsertReputation', () => {
    it('should upsert reputation with all metrics', async () => {
      const reputationData: ReputationData = {
        totalScore: 750,
        tier: 'BUILDER',
        metrics: [
          { name: 'Base Tenure', score: 100, weight: 15, maxScore: 150 },
          { name: 'Zora Mints', score: 80, weight: 12, maxScore: 120 },
          { name: 'Timeliness', score: 50, weight: 8, maxScore: 80 },
          { name: 'Farcaster', score: 90, weight: 15, maxScore: 150 },
          { name: 'Builder', score: 150, weight: 20, maxScore: 200 },
          { name: 'Creator', score: 60, weight: 10, maxScore: 100 },
          { name: 'Onchain Summer', score: 40, weight: 8, maxScore: 80 },
          { name: 'Hackathon', score: 35, weight: 7, maxScore: 70 },
          { name: 'Early Adopter', score: 25, weight: 5, maxScore: 50 },
        ],
        lastCalculated: new Date(),
      };

      const mockReputation = {
        id: 'rep-1',
        userId: 'user-1',
        ...reputationData,
      };

      vi.mocked(prisma.reputation.upsert).mockResolvedValue(mockReputation as any);

      const result = await upsertReputation('user-1', reputationData);

      expect(result).toEqual(mockReputation);
      expect(prisma.reputation.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: expect.objectContaining({
          userId: 'user-1',
          totalScore: 750,
          tier: 'BUILDER',
          baseTenureScore: 100,
          zoraMintsScore: 80,
          timelinessScore: 50,
          farcasterScore: 90,
          builderScore: 150,
          creatorScore: 60,
          onchainSummerScore: 40,
          hackathonScore: 35,
          earlyAdopterScore: 25,
        }),
        update: expect.objectContaining({
          totalScore: 750,
          tier: 'BUILDER',
        }),
      });
    });

    it('should handle missing metrics gracefully', async () => {
      const reputationData: ReputationData = {
        totalScore: 100,
        tier: 'TOURIST',
        metrics: [
          { name: 'Base Tenure', score: 100, weight: 15, maxScore: 150 },
        ],
        lastCalculated: new Date(),
      };

      vi.mocked(prisma.reputation.upsert).mockResolvedValue({} as any);

      await upsertReputation('user-1', reputationData);

      expect(prisma.reputation.upsert).toHaveBeenCalled();
      const call = vi.mocked(prisma.reputation.upsert).mock.calls[0]?.[0];
      if (call) {
        expect(call.create?.zoraMintsScore).toBe(0); // Missing metric should default to 0
        expect(call.create?.farcasterScore).toBe(0);
      }
    });
  });
});
