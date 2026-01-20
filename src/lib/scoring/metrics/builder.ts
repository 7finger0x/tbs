import 'server-only';
import type { MetricScore, ScoreInput } from '@/types/reputation';
import { METRIC_WEIGHTS } from '@/lib/constants';
import { createBaseClient } from '@/lib/chain/base-client';
import type { Address, Hash } from 'viem';
import { normalizeAddress } from '@/lib/utils';

/**
 * Detect contract deployments from transaction receipts
 * Contract deployments have 'to' field as null and create a contract address
 */
async function detectContractDeployments(address: Address): Promise<number> {
  try {
    const basescanApiKey = process.env.BASESCAN_API_KEY;

    if (!basescanApiKey) {
      // Fall back to heuristic if no API key
      return 0;
    }

    // Use BaseScan API to get transaction list
    const url = `https://api.basescan.org/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${basescanApiKey}`;

    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
    const data = await response.json();

    if (data.status !== '1' || !data.result) {
      return 0;
    }

    // Filter for contract creation transactions
    // Contract deployments have 'to' as empty string and 'contractAddress' is populated
    const deployments = data.result.filter((tx: any) =>
      tx.to === '' && tx.contractAddress && tx.contractAddress !== ''
    );

    return deployments.length;
  } catch (error) {
    return 0;
  }
}

/**
 * Calculate Builder Activity Score
 * Detects contract deployments and builder activity by analyzing transaction receipts
 */
export async function calculateBuilder(input: ScoreInput): Promise<MetricScore> {
  const maxScore = METRIC_WEIGHTS.BUILDER * 10; // 200 max
  const address = input.address as Address;
  const normalizedAddress = normalizeAddress(address);

  try {
    const client = createBaseClient();

    // Get transaction count
    const txCount = await client.getTransactionCount({ address: normalizedAddress });

    if (txCount === 0) {
      return {
        name: 'Builder',
        score: 0,
        weight: METRIC_WEIGHTS.BUILDER,
        maxScore,
      };
    }

    // Detect actual contract deployments using BaseScan API
    const contractDeployments = await detectContractDeployments(normalizedAddress);

    // Calculate score based on actual contract deployments
    let score = 0;

    if (contractDeployments >= 10) {
      score = 200; // Prolific builder - 10+ contracts
    } else if (contractDeployments >= 5) {
      score = 150; // Active builder - 5-9 contracts
    } else if (contractDeployments >= 3) {
      score = 100; // Regular builder - 3-4 contracts
    } else if (contractDeployments >= 1) {
      score = 50; // New builder - 1-2 contracts
    } else if (txCount > 100) {
      // High transaction count but no deployments detected
      // Give minimal credit for on-chain activity
      score = 10; // Active user (not a builder)
    } else if (txCount > 50) {
      score = 5; // Some activity
    }
    
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
