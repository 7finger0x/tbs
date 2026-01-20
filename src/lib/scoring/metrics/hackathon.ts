import 'server-only';
import type { MetricScore, ScoreInput } from '@/types/reputation';
import { METRIC_WEIGHTS } from '@/lib/constants';
import type { Address } from 'viem';

/**
 * Calculate Hackathon Participation Score
 * Tracks hackathon submissions, finalists, and winners
 */
export async function calculateHackathon(input: ScoreInput): Promise<MetricScore> {
  const maxScore = METRIC_WEIGHTS.HACKATHON * 10; // 70 max
  
  try {
    // Hackathon participation tracked via:
    // 1. EAS attestations for submissions/finalists/winners
    // 2. Event-specific contracts
    // 3. Database records
    
    // Check EAS for hackathon attestations
    const easGraphUrl = 'https://base.easscan.org/graphql';
    const hackathonSchema = process.env.HACKATHON_SCHEMA_UID;
    
    if (!hackathonSchema) {
      return {
        name: 'Hackathon',
        score: 0,
        weight: METRIC_WEIGHTS.HACKATHON,
        maxScore,
      };
    }
    
    const query = `
      query GetAttestations($where: AttestationWhereInput) {
        attestations(where: $where) {
          id
          data
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
              schemaId: { equals: hackathonSchema },
              revoked: { equals: false },
            },
          },
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const attestations = data.data?.attestations || [];
        
        let score = 0;
        
        // Parse attestation data to determine placement
        for (const attestation of attestations) {
          // Would parse attestation.data to determine: submission, finalist, or winner
          // For now, assume all are submissions
          score += 20; // Base submission score
          
          // In production, would check attestation data for:
          // - "finalist" flag: +30 points
          // - "winner" flag: +50 points
        }
        
        return {
          name: 'Hackathon',
          score: Math.min(score, maxScore),
          weight: METRIC_WEIGHTS.HACKATHON,
          maxScore,
        };
      }
    } catch (error) {
      console.error('Error fetching hackathon data:', error);
    }
    
    return {
      name: 'Hackathon',
      score: 0,
      weight: METRIC_WEIGHTS.HACKATHON,
      maxScore,
    };
  } catch (error) {
    console.error('Error calculating hackathon score:', error);
    return {
      name: 'Hackathon',
      score: 0,
      weight: METRIC_WEIGHTS.HACKATHON,
      maxScore,
    };
  }
}
