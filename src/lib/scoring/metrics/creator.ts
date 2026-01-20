import 'server-only';
import type { MetricScore, ScoreInput } from '@/types/reputation';
import { METRIC_WEIGHTS } from '@/lib/constants';
import type { Address } from 'viem';
import { normalizeAddress } from '@/lib/utils';

/**
 * Calculate Creator Score
 * Tracks NFT creation and creator economy participation
 */
export async function calculateCreator(input: ScoreInput): Promise<MetricScore> {
  const maxScore = METRIC_WEIGHTS.CREATOR * 10; // 100 max
  const address = input.address as Address;
  const normalizedAddress = normalizeAddress(address);
  
  try {
    // Check Zora creator activity
    // Zora creators deploy NFT collections
    const zoraApiKey = process.env.ZORA_API_KEY;
    
    if (!zoraApiKey) {
      return {
        name: 'Creator',
        score: 0,
        weight: METRIC_WEIGHTS.CREATOR,
        maxScore,
      };
    }
    
    // Query Zora for collections created by this address
    const query = `
      query GetCreatorCollections($address: String!) {
        collections(where: { creator: $address }) {
          id
          address
          totalMints
          totalVolume
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
        const collections = data.data?.collections || [];
        const collectionCount = collections.length;
        
        // Calculate total volume from collections
        const totalVolume = collections.reduce(
          (sum: number, col: { totalVolume?: string }) => 
            sum + (parseFloat(col.totalVolume || '0') / 1e18), // Convert from wei
          0
        );
        
        // Score: 10 points per collection + volume bonus
        let score = Math.min(collectionCount * 10, 60);
        
        // Volume bonus: logarithmic scale
        if (totalVolume > 0) {
          const volumeBonus = Math.min(40, Math.log10(totalVolume + 1) * 5);
          score += volumeBonus;
        }
        
        return {
          name: 'Creator',
          score: Math.min(Math.round(score), maxScore),
          weight: METRIC_WEIGHTS.CREATOR,
          maxScore,
        };
      }
    } catch (error) {
      console.error('Error fetching creator data:', error);
    }
    
    return {
      name: 'Creator',
      score: 0,
      weight: METRIC_WEIGHTS.CREATOR,
      maxScore,
    };
  } catch (error) {
    console.error('Error calculating creator score:', error);
    return {
      name: 'Creator',
      score: 0,
      weight: METRIC_WEIGHTS.CREATOR,
      maxScore,
    };
  }
}
