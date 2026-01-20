import 'server-only';
import type { MetricScore, ScoreInput } from '@/types/reputation';
import { METRIC_WEIGHTS } from '@/lib/constants';
import type { Address } from 'viem';

/**
 * Calculate Onchain Summer Badge Score
 * Tracks participation in Base's Onchain Summer event
 */
export async function calculateOnchainSummer(input: ScoreInput): Promise<MetricScore> {
  const maxScore = METRIC_WEIGHTS.ONCHAIN_SUMMER * 10; // 80 max
  
  try {
    // Onchain Summer badges would be tracked via:
    // 1. EAS attestations
    // 2. Event-specific contracts
    // 3. Database records
    
    // Check EAS for Onchain Summer attestations
    // Schema UID for Onchain Summer badges (would need actual schema)
    const easGraphUrl = 'https://base.easscan.org/graphql';
    const onchainSummerSchema = process.env.ONCHAIN_SUMMER_SCHEMA_UID;
    
    if (!onchainSummerSchema) {
      return {
        name: 'Onchain Summer',
        score: 0,
        weight: METRIC_WEIGHTS.ONCHAIN_SUMMER,
        maxScore,
      };
    }
    
    const query = `
      query GetAttestations($where: AttestationWhereInput) {
        attestations(where: $where) {
          id
          schemaId
        }
      }
    `;
    
    try {
      const response = await fetch(easGraphUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: {
            where: {
              recipient: { equals: input.address.toLowerCase() },
              schemaId: { equals: onchainSummerSchema },
              revoked: { equals: false },
            },
          },
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const badges = data.data?.attestations || [];
        const badgeCount = badges.length;
        
        // Score: 20 points per badge, max 80
        const score = Math.min(badgeCount * 20, maxScore);
        
        return {
          name: 'Onchain Summer',
          score,
          weight: METRIC_WEIGHTS.ONCHAIN_SUMMER,
          maxScore,
        };
      }
    } catch (error) {
      console.error('Error fetching Onchain Summer badges:', error);
    }
    
    return {
      name: 'Onchain Summer',
      score: 0,
      weight: METRIC_WEIGHTS.ONCHAIN_SUMMER,
      maxScore,
    };
  } catch (error) {
    console.error('Error calculating Onchain Summer score:', error);
    return {
      name: 'Onchain Summer',
      score: 0,
      weight: METRIC_WEIGHTS.ONCHAIN_SUMMER,
      maxScore,
    };
  }
}
