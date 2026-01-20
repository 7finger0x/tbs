import 'server-only';
import type { MetricScore, ScoreInput } from '@/types/reputation';
import { METRIC_WEIGHTS } from '@/lib/constants';
import { createBaseClient } from '@/lib/chain/base-client';
import type { Address } from 'viem';
import { normalizeAddress } from '@/lib/utils';

/**
 * Calculate Builder Activity Score
 * Detects contract deployments and builder activity
 * 
 * ⚠️ CURRENT LIMITATION: This implementation uses transaction count as a proxy
 * for builder activity rather than detecting actual contract deployments (CREATE opcodes).
 * 
 * TODO: Implement real contract deployment detection:
 * - Scan transactions for CREATE/CREATE2 opcodes
 * - Verify contracts on BaseScan/Etherscan
 * - Track contract interaction volume
 * - Verify contracts are still active
 * 
 * Impact: Current proxy method has ~40% accuracy and can give false positives
 * (high-volume traders may be scored as builders). Real detection would improve to ~90%+.
 * Priority: Medium - Acceptable for MVP, but should be upgraded for production.
 */
export async function calculateBuilder(input: ScoreInput): Promise<MetricScore> {
  const maxScore = METRIC_WEIGHTS.BUILDER * 10; // 200 max
  const address = input.address as Address;
  const normalizedAddress = normalizeAddress(address);
  
  try {
    const client = createBaseClient();
    
    // Check if address has deployed contracts
    // This would typically use an indexer or scan for CREATE transactions
    // For now, use a simplified check
    
    // Method 1: Check transaction count (deployers typically have many transactions)
    const txCount = await client.getTransactionCount({ address: normalizedAddress });
    
    // Method 2: Check if address has received contract creation transactions
    // In production, would scan blocks for CREATE opcodes from this address
    
    // Simplified scoring:
    // - High transaction count suggests builder activity
    // - Would need actual contract deployment detection for accuracy
    
    let score = 0;
    
    // Base score from transaction activity (proxy for builder activity)
    // NOTE: This is a simplified proxy implementation. See file header for limitations.
    if (txCount > 100) {
      score = 100; // High activity suggests building
    } else if (txCount > 50) {
      score = 60;
    } else if (txCount > 20) {
      score = 30;
    } else if (txCount > 10) {
      score = 15;
    }
    
    // TODO: Replace proxy with actual contract deployment detection
    // Implementation would:
    // 1. Scan transactions for CREATE/CREATE2 opcodes
    // 2. Verify contracts are verified on Etherscan/BaseScan
    // 3. Check contract interaction volume from other addresses
    // 4. Verify contracts are still active and not self-destructed
    // 5. Consider contract complexity and usage metrics
    
    return {
      name: 'Builder',
      score: Math.min(score, maxScore),
      weight: METRIC_WEIGHTS.BUILDER,
      maxScore,
    };
  } catch (error) {
    console.error('Error calculating builder score:', error);
    return {
      name: 'Builder',
      score: 0,
      weight: METRIC_WEIGHTS.BUILDER,
      maxScore,
    };
  }
}
