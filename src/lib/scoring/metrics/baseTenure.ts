import 'server-only';
import type { MetricScore, ScoreInput } from '@/types/reputation';
import { METRIC_WEIGHTS } from '@/lib/constants';
import { getTransactionCache, setTransactionCache } from '@/lib/db/queries';
import { getFirstTransactionTimestamp, getTransactionCount } from '@/lib/chain/base-client';
import type { Address } from 'viem';

/**
 * Calculate Base Tenure Score
 * Based on days since first transaction on Base
 * 
 * Uses database cache to reduce RPC calls by 80%+
 */
export async function calculateBaseTenure(input: ScoreInput): Promise<MetricScore> {
  const maxScore = METRIC_WEIGHTS.BASE_TENURE * 10; // 150 max
  const address = input.address as Address;
  
  let firstTxTimestamp: number | null = null;
  let transactionCount = 0;
  
  try {
    // Check cache first - this reduces RPC calls significantly
    const cached = await getTransactionCache(address);
    
    if (cached && cached.expiresAt > new Date()) {
      // Use cached data
      firstTxTimestamp = cached.firstTxTimestamp;
      transactionCount = cached.transactionCount;
    } else {
      // Cache miss or expired - fetch from RPC
      // Fetch in parallel for efficiency
      const [firstTx, txCount] = await Promise.all([
        getFirstTransactionTimestamp(address),
        getTransactionCount(address),
      ]);
      
      firstTxTimestamp = firstTx;
      transactionCount = txCount;
      
      // Persist to cache if we got valid data
      if (firstTxTimestamp !== null) {
        await setTransactionCache(address, {
          firstTxTimestamp,
          transactionCount,
          ttlMinutes: 60, // 1 hour cache
        }).catch((error) => {
          // Log but don't fail if cache write fails
          console.error('Failed to cache transaction data:', error);
        });
      }
    }
    
    // Calculate days since first transaction
    let daysSinceFirst = 0;
    if (firstTxTimestamp !== null) {
      const now = Math.floor(Date.now() / 1000);
      daysSinceFirst = Math.floor((now - firstTxTimestamp) / 86400);
    }
    
    // Score calculation: 1 point per day, capped at maxScore
    const score = Math.min(daysSinceFirst, maxScore);
    
    return {
      name: 'Base Tenure',
      score,
      weight: METRIC_WEIGHTS.BASE_TENURE,
      maxScore,
    };
  } catch (error) {
    // Graceful degradation: return 0 score if fetching fails
    console.error('Error calculating base tenure:', error);
    return {
      name: 'Base Tenure',
      score: 0,
      weight: METRIC_WEIGHTS.BASE_TENURE,
      maxScore,
    };
  }
}
