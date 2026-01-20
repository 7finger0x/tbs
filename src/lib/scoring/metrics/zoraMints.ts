import 'server-only';
import type { MetricScore, ScoreInput } from '@/types/reputation';
import { METRIC_WEIGHTS } from '@/lib/constants';
import type { Address } from 'viem';
import { normalizeAddress } from '@/lib/utils';

/**
 * Calculate Zora Mints Score
 * Tracks NFT minting activity on Zora platform
 */
export async function calculateZoraMints(input: ScoreInput): Promise<MetricScore> {
  const maxScore = METRIC_WEIGHTS.ZORA_MINTS * 10; // 120 max
  const address = input.address as Address;
  const normalizedAddress = normalizeAddress(address);
  
  try {
    // Zora API endpoint for user mints
    // In production, use Zora API or indexer
    const zoraApiKey = process.env.ZORA_API_KEY;
    
    if (!zoraApiKey) {
      // Fallback: Check database for Zora mint records (if using Ponder indexer)
      // For now, return placeholder
      return {
        name: 'Zora Mints',
        score: 0,
        weight: METRIC_WEIGHTS.ZORA_MINTS,
        maxScore,
      };
    }
    
    // Query Zora API for mints
    // Zora GraphQL endpoint: https://api.zora.co/graphql
    const query = `
      query GetUserMints($address: String!) {
        mints(where: { minter: $address }) {
          id
          tokenId
          collectionAddress
          timestamp
        }
      }
    `;
    
    try {
      const response = await fetch('https://api.zora.co/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': zoraApiKey,
        },
        body: JSON.stringify({
          query,
          variables: { address: normalizedAddress },
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const mints = data.data?.mints || [];
        const mintCount = mints.length;
        
        // Score: 2 points per mint, capped at maxScore
        const score = Math.min(mintCount * 2, maxScore);
        
        return {
          name: 'Zora Mints',
          score,
          weight: METRIC_WEIGHTS.ZORA_MINTS,
          maxScore,
        };
      }
    } catch (error) {
      console.error('Error fetching Zora mints:', error);
    }
    
    // Fallback: return 0 if API fails
    return {
      name: 'Zora Mints',
      score: 0,
      weight: METRIC_WEIGHTS.ZORA_MINTS,
      maxScore,
    };
  } catch (error) {
    console.error('Error calculating Zora mints:', error);
    return {
      name: 'Zora Mints',
      score: 0,
      weight: METRIC_WEIGHTS.ZORA_MINTS,
      maxScore,
    };
  }
}
