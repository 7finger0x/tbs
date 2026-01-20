import 'server-only';
import type { MetricScore, ScoreInput } from '@/types/reputation';
import { METRIC_WEIGHTS } from '@/lib/constants';
import { getTransactionCache } from '@/lib/db/queries';
import type { Address } from 'viem';
import { normalizeAddress } from '@/lib/utils';

/**
 * Calculate Timeliness Score
 * Rewards consistent activity over time
 * Penalizes long periods of inactivity
 */
export async function calculateTimeliness(input: ScoreInput): Promise<MetricScore> {
  const maxScore = METRIC_WEIGHTS.TIMELINESS * 10; // 80 max
  const address = input.address as Address;
  const normalizedAddress = normalizeAddress(address);
  
  try {
    // Get transaction cache to analyze timing
    const txCache = await getTransactionCache(normalizedAddress);
    
    if (!txCache) {
      return {
        name: 'Timeliness',
        score: 0,
        weight: METRIC_WEIGHTS.TIMELINESS,
        maxScore,
      };
    }
    
    const now = Math.floor(Date.now() / 1000);
    const firstTxTimestamp = txCache.firstTxTimestamp;
    const walletAgeDays = (now - firstTxTimestamp) / 86400;
    const transactionCount = txCache.transactionCount;
    
    // Calculate activity consistency
    // Average transactions per day
    const avgTxPerDay = transactionCount / Math.max(1, walletAgeDays);
    
    // Score based on consistent activity
    // 1 point per 0.1 transactions per day (max 50 points)
    const consistencyScore = Math.min(50, avgTxPerDay * 10);
    
    // Recency bonus: reward recent activity
    // Check if last transaction was recent (would need lastTxTimestamp)
    // For now, use transaction count as proxy
    const recencyScore = transactionCount > 10 ? 30 : transactionCount > 5 ? 15 : 0;
    
    const score = Math.min(consistencyScore + recencyScore, maxScore);
    
    return {
      name: 'Timeliness',
      score: Math.round(score),
      weight: METRIC_WEIGHTS.TIMELINESS,
      maxScore,
    };
  } catch (error) {
    console.error('Error calculating timeliness:', error);
    return {
      name: 'Timeliness',
      score: 0,
      weight: METRIC_WEIGHTS.TIMELINESS,
      maxScore,
    };
  }
}
