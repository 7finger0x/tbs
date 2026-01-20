import 'server-only';
import type { Address } from 'viem';
import { normalizeAddress } from '@/lib/utils';
import { getCachedCoinbaseVerification, type CoinbaseVerification } from './coinbase-verification';
import { prisma } from '@/lib/db';

/**
 * Sybil Resistance Multiplier Calculation
 * 
 * Combines multiple identity verification signals to calculate a multiplier
 * that reduces Sybil attack effectiveness.
 * 
 * Signals:
 * - Coinbase Verification: +0.2x
 * - Multiple linked wallets: +0.1x (per additional wallet, max +0.3x)
 * - Wallet age: +0.1x for >1 year old
 * - EIP-712 signature: +0.05x (proof of wallet control)
 * - Gitcoin Passport: +0.1x
 * 
 * Maximum multiplier: 1.7x
 */

export interface SybilResistanceFactors {
  coinbaseVerified: boolean;
  linkedWalletCount: number;
  walletAgeMonths: number;
  hasEIP712Signature: boolean;
  gitcoinPassportScore?: number;
  farcasterLinked: boolean;
}

export interface SybilResistanceResult {
  multiplier: number;
  factors: SybilResistanceFactors;
  breakdown: {
    coinbaseBonus: number;
    walletCountBonus: number;
    walletAgeBonus: number;
    signatureBonus: number;
    passportBonus: number;
    farcasterBonus: number;
  };
}

/**
 * Calculate Sybil resistance multiplier for an address
 */
export async function calculateSybilResistance(
  address: Address,
  userId?: string
): Promise<SybilResistanceResult> {
  const normalizedAddress = normalizeAddress(address);
  
  // Check Coinbase verification
  const coinbaseVerification = await getCachedCoinbaseVerification(normalizedAddress);
  
  // Get linked wallets if userId provided
  let linkedWalletCount = 1; // At least the primary wallet
  if (userId) {
    try {
      const wallets = await prisma.wallet.findMany({
        where: { userId },
      });
      linkedWalletCount = wallets.length;
    } catch {
      // Ignore errors, use default
    }
  }
  
  // Get wallet age (from transaction cache if available)
  let walletAgeMonths = 0;
  try {
    const txCache = await prisma.transactionCache.findUnique({
      where: { address: normalizedAddress },
    });
    
    if (txCache) {
      const now = Math.floor(Date.now() / 1000);
      const ageSeconds = now - txCache.firstTxTimestamp;
      walletAgeMonths = ageSeconds / (30 * 24 * 60 * 60); // Approximate
    }
  } catch {
    // Ignore errors
  }
  
  // Check for EIP-712 signature (wallet linking proof)
  let hasEIP712Signature = false;
  if (userId) {
    try {
      const wallet = await prisma.wallet.findFirst({
        where: {
          userId,
          address: normalizedAddress,
        },
      });
      hasEIP712Signature = !!wallet?.signature; // Signature indicates EIP-712 proof
    } catch {
      // Ignore errors
    }
  }
  
  // Check Gitcoin Passport
  let gitcoinPassportScore: number | null = null;
  try {
    const { getCachedGitcoinPassportScore } = await import('./gitcoin-passport');
    gitcoinPassportScore = await getCachedGitcoinPassportScore(normalizedAddress);
  } catch (error) {
    // Gracefully handle errors - passport is optional
    console.error('Error fetching Gitcoin Passport:', error);
  }
  
  // Check Farcaster linkage
  let farcasterLinked = false;
  try {
    const { getFarcasterUserByAddress } = await import('../scoring/social/farcaster-api');
    const farcasterUser = await getFarcasterUserByAddress(normalizedAddress);
    farcasterLinked = !!farcasterUser?.fid;
  } catch {
    // Ignore errors, assume not linked
  }
  
  // Calculate bonuses
  const coinbaseBonus = coinbaseVerification.isVerified ? 0.2 : 0;
  const walletCountBonus = Math.min(0.3, (linkedWalletCount - 1) * 0.1);
  const walletAgeBonus = walletAgeMonths >= 12 ? 0.1 : 0;
  const signatureBonus = hasEIP712Signature ? 0.05 : 0;
  const passportBonus = gitcoinPassportScore && gitcoinPassportScore > 20 ? 0.1 : 0;
  const farcasterBonus = farcasterLinked ? 0.05 : 0;
  
  // Calculate total multiplier
  const multiplier = Math.min(
    1.7, // Maximum multiplier
    1.0 + coinbaseBonus + walletCountBonus + walletAgeBonus + signatureBonus + passportBonus + farcasterBonus
  );
  
  return {
    multiplier,
    factors: {
      coinbaseVerified: coinbaseVerification.isVerified,
      linkedWalletCount,
      walletAgeMonths,
      hasEIP712Signature,
      gitcoinPassportScore: gitcoinPassportScore ?? undefined,
      farcasterLinked,
    },
    breakdown: {
      coinbaseBonus,
      walletCountBonus,
      walletAgeBonus,
      signatureBonus,
      passportBonus,
      farcasterBonus,
    },
  };
}

/**
 * Check if address exhibits Sybil attack patterns
 * 
 * Indicators:
 * - Very new wallet (< 7 days) with high activity
 * - No identity verification
 * - Multiple wallets from same IP (would need IP tracking)
 * - Identical transaction patterns
 */
export async function detectSybilPatterns(address: Address): Promise<{
  isPotentialSybil: boolean;
  riskScore: number; // 0-1
  indicators: string[];
}> {
  const normalizedAddress = normalizeAddress(address);
  const indicators: string[] = [];
  let riskScore = 0;
  
  // Check wallet age
  try {
    const txCache = await prisma.transactionCache.findUnique({
      where: { address: normalizedAddress },
    });
    
    if (txCache) {
      const now = Math.floor(Date.now() / 1000);
      const ageDays = (now - txCache.firstTxTimestamp) / 86400;
      
      if (ageDays < 7 && txCache.transactionCount > 50) {
        indicators.push('Very new wallet with high activity');
        riskScore += 0.3;
      }
      
      if (ageDays < 30) {
        riskScore += 0.1;
      }
    } else {
      // No transaction history - could be new or Sybil
      riskScore += 0.2;
      indicators.push('No transaction history');
    }
  } catch {
    // Ignore errors
  }
  
  // Check identity verification
  const coinbaseVerification = await getCachedCoinbaseVerification(normalizedAddress);
  if (!coinbaseVerification.isVerified) {
    riskScore += 0.2;
    indicators.push('No Coinbase verification');
  }
  
  // Check if wallet is linked to a user account
  try {
    const wallet = await prisma.wallet.findUnique({
      where: {
        address: normalizedAddress,
      },
    });
    
    if (!wallet) {
      riskScore += 0.1;
      indicators.push('Wallet not linked to user account');
    }
  } catch {
    // Ignore errors
  }
  
  // High risk threshold
  const isPotentialSybil = riskScore >= 0.5;
  
  return {
    isPotentialSybil,
    riskScore: Math.min(1.0, riskScore),
    indicators,
  };
}
