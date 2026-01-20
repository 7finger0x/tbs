import 'server-only';
import { prisma } from './index';
import type { Address } from 'viem';
import { normalizeAddress } from '@/lib/utils';
import type { ReputationData } from '@/types/reputation';

export async function getUserByAddress(address: Address) {
  try {
    return await prisma.user.findUnique({
      where: { primaryAddress: normalizeAddress(address) },
      include: {
        wallets: true,
        reputation: true,
      },
    });
  } catch (error) {
    // Handle database connection/authentication errors gracefully
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes('can\'t reach database server') ||
        errorMessage.includes('authentication failed') ||
        errorMessage.includes('database credentials') ||
        errorMessage.includes('connection')
      ) {
        console.warn('Database connection error:', error.message);
        return null;
      }
    }
    throw error;
  }
}

export async function createUser(address: Address) {
  try {
    return await prisma.user.create({
      data: {
        primaryAddress: normalizeAddress(address),
      },
      include: {
        wallets: true,
        reputation: true,
      },
    });
  } catch (error) {
    // Handle database connection errors gracefully
    if (error instanceof Error && error.message.includes('Can\'t reach database server')) {
      console.warn('Database connection error:', error.message);
      throw new Error('Database unavailable. Please check your connection settings.');
    }
    throw error;
  }
}

export async function linkWallet(userId: string, address: Address, signature: string) {
  return prisma.wallet.create({
    data: {
      userId,
      address: normalizeAddress(address),
      signature,
    },
  });
}

export async function upsertReputation(userId: string, data: ReputationData) {
  return prisma.reputation.upsert({
    where: { userId },
    create: {
      userId,
      totalScore: data.totalScore,
      tier: data.tier,
      baseTenureScore: data.metrics.find((m) => m.name === 'Base Tenure')?.score ?? 0,
      zoraMintsScore: data.metrics.find((m) => m.name === 'Zora Mints')?.score ?? 0,
      timelinessScore: data.metrics.find((m) => m.name === 'Timeliness')?.score ?? 0,
      farcasterScore: data.metrics.find((m) => m.name === 'Farcaster')?.score ?? 0,
      builderScore: data.metrics.find((m) => m.name === 'Builder')?.score ?? 0,
      creatorScore: data.metrics.find((m) => m.name === 'Creator')?.score ?? 0,
      onchainSummerScore: data.metrics.find((m) => m.name === 'Onchain Summer')?.score ?? 0,
      hackathonScore: data.metrics.find((m) => m.name === 'Hackathon')?.score ?? 0,
      earlyAdopterScore: data.metrics.find((m) => m.name === 'Early Adopter')?.score ?? 0,
      lastCalculated: data.lastCalculated,
    },
    update: {
      totalScore: data.totalScore,
      tier: data.tier,
      baseTenureScore: data.metrics.find((m) => m.name === 'Base Tenure')?.score ?? 0,
      zoraMintsScore: data.metrics.find((m) => m.name === 'Zora Mints')?.score ?? 0,
      timelinessScore: data.metrics.find((m) => m.name === 'Timeliness')?.score ?? 0,
      farcasterScore: data.metrics.find((m) => m.name === 'Farcaster')?.score ?? 0,
      builderScore: data.metrics.find((m) => m.name === 'Builder')?.score ?? 0,
      creatorScore: data.metrics.find((m) => m.name === 'Creator')?.score ?? 0,
      onchainSummerScore: data.metrics.find((m) => m.name === 'Onchain Summer')?.score ?? 0,
      hackathonScore: data.metrics.find((m) => m.name === 'Hackathon')?.score ?? 0,
      earlyAdopterScore: data.metrics.find((m) => m.name === 'Early Adopter')?.score ?? 0,
      lastCalculated: data.lastCalculated,
    },
  });
}

// Transaction Cache functions
export async function getTransactionCache(address: Address) {
  return prisma.transactionCache.findUnique({
    where: { address: normalizeAddress(address) },
  });
}

export async function setTransactionCache(
  address: Address,
  data: {
    firstTxTimestamp: number;
    transactionCount: number;
    lastBlockNumber?: bigint | null;
    ttlMinutes?: number;
  }
) {
  const normalizedAddress = normalizeAddress(address);
  const expiresAt = new Date(Date.now() + (data.ttlMinutes ?? 60) * 60 * 1000);

  return prisma.transactionCache.upsert({
    where: { address: normalizedAddress },
    update: {
      firstTxTimestamp: data.firstTxTimestamp,
      transactionCount: data.transactionCount,
      lastBlockNumber: data.lastBlockNumber ?? null,
      expiresAt,
    },
    create: {
      address: normalizedAddress,
      firstTxTimestamp: data.firstTxTimestamp,
      transactionCount: data.transactionCount,
      lastBlockNumber: data.lastBlockNumber ?? null,
      expiresAt,
    },
  });
}

// Transaction Record functions
export async function createTransactionRecord(
  address: Address,
  data: {
    txHash: string;
    timestamp: number;
    gasUsed: string;
    gasPrice: string;
    to?: string | null;
    value: string;
    blockNumber?: bigint | null;
  }
) {
  return prisma.transactionRecord.create({
    data: {
      address: normalizeAddress(address),
      txHash: data.txHash,
      timestamp: data.timestamp,
      gasUsed: data.gasUsed,
      gasPrice: data.gasPrice,
      to: data.to ?? null,
      value: data.value,
      blockNumber: data.blockNumber ?? null,
    },
  });
}

// DeFi Metrics functions
export async function getDefiMetrics(address: Address) {
  return prisma.defiMetrics.findUnique({
    where: { address: normalizeAddress(address) },
  });
}

export async function upsertDefiMetrics(
  address: Address,
  data: {
    uniqueProtocols: number;
    vintageContracts: number;
    protocolCategories: string[];
    totalInteractions: number;
    gasUsedETH: number;
    volumeUSD: number;
    liquidityDurationDays: number;
    liquidityPositions: number;
    lendingUtilization: number;
    capitalTier: string;
  }
) {
  const normalizedAddress = normalizeAddress(address);

  return prisma.defiMetrics.upsert({
    where: { address: normalizedAddress },
    update: {
      uniqueProtocols: data.uniqueProtocols,
      vintageContracts: data.vintageContracts,
      protocolCategories: data.protocolCategories,
      totalInteractions: data.totalInteractions,
      gasUsedETH: data.gasUsedETH,
      volumeUSD: data.volumeUSD,
      liquidityDurationDays: data.liquidityDurationDays,
      liquidityPositions: data.liquidityPositions,
      lendingUtilization: data.lendingUtilization,
      capitalTier: data.capitalTier,
      lastUpdated: new Date(),
    },
    create: {
      address: normalizedAddress,
      uniqueProtocols: data.uniqueProtocols,
      vintageContracts: data.vintageContracts,
      protocolCategories: data.protocolCategories,
      totalInteractions: data.totalInteractions,
      gasUsedETH: data.gasUsedETH,
      volumeUSD: data.volumeUSD,
      liquidityDurationDays: data.liquidityDurationDays,
      liquidityPositions: data.liquidityPositions,
      lendingUtilization: data.lendingUtilization,
      capitalTier: data.capitalTier,
    },
  });
}

// Economic Vector functions
export async function getEconomicVector(address: Address) {
  return prisma.economicVector.findUnique({
    where: { address: normalizeAddress(address) },
  });
}

export async function upsertEconomicVector(
  address: Address,
  data: {
    capitalPillar: number;
    diversityPillar: number;
    identityPillar: number;
    totalScore: number;
    multiplier: number;
    breakdown: unknown; // Will be JSON stringified
  }
) {
  const normalizedAddress = normalizeAddress(address);

  return prisma.economicVector.upsert({
    where: { address: normalizedAddress },
    update: {
      capitalPillar: data.capitalPillar,
      diversityPillar: data.diversityPillar,
      identityPillar: data.identityPillar,
      totalScore: data.totalScore,
      multiplier: data.multiplier,
      breakdown: JSON.stringify(data.breakdown),
      calculatedAt: new Date(),
    },
    create: {
      address: normalizedAddress,
      capitalPillar: data.capitalPillar,
      diversityPillar: data.diversityPillar,
      identityPillar: data.identityPillar,
      totalScore: data.totalScore,
      multiplier: data.multiplier,
      breakdown: JSON.stringify(data.breakdown),
    },
  });
}
