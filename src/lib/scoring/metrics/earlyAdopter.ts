import 'server-only';
import type { MetricScore, ScoreInput } from '@/types/reputation';
import { METRIC_WEIGHTS } from '@/lib/constants';
import { getTransactionCache } from '@/lib/db/queries';
import type { Address } from 'viem';
import { normalizeAddress } from '@/lib/utils';

/**
 * Calculate Early Adopter Score
 * Detects genesis users and early Base ecosystem participants
 */
export async function calculateEarlyAdopter(input: ScoreInput): Promise<MetricScore> {
  const maxScore = METRIC_WEIGHTS.EARLY_ADOPTER * 10; // 50 max
  const address = input.address as Address;
  const normalizedAddress = normalizeAddress(address);
  
  try {
    // Get transaction cache to check wallet age
    const txCache = await getTransactionCache(normalizedAddress);
    
    if (!txCache) {
      return {
        name: 'Early Adopter',
        score: 0,
        weight: METRIC_WEIGHTS.EARLY_ADOPTER,
        maxScore,
      };
    }
    
    const now = Math.floor(Date.now() / 1000);
    const firstTxTimestamp = txCache.firstTxTimestamp;
    
    // Base mainnet launch: August 9, 2023 (timestamp: 1691539200)
    const baseLaunchTimestamp = 1691539200;
    const daysSinceLaunch = (firstTxTimestamp - baseLaunchTimestamp) / 86400;
    
    let score = 0;
    
    // Genesis users (first 7 days): 50 points
    if (daysSinceLaunch <= 7) {
      score = 50;
    }
    // Month 1 users (first 30 days): 40 points
    else if (daysSinceLaunch <= 30) {
      score = 40;
    }
    // First 3 months: 30 points
    else if (daysSinceLaunch <= 90) {
      score = 30;
    }
    // First 6 months: 20 points
    else if (daysSinceLaunch <= 180) {
      score = 20;
    }
    // First year: 10 points
    else if (daysSinceLaunch <= 365) {
      score = 10;
    }
    
    return {
      name: 'Early Adopter',
      score: Math.min(score, maxScore),
      weight: METRIC_WEIGHTS.EARLY_ADOPTER,
      maxScore,
    };
  } catch (error) {
    console.error('Error calculating early adopter score:', error);
    return {
      name: 'Early Adopter',
      score: 0,
      weight: METRIC_WEIGHTS.EARLY_ADOPTER,
      maxScore,
    };
  }
}
