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
          try {
            // EAS data is ABI-encoded, decode it to check for placement flags
            // Typical hackathon schema includes: projectName, description, placement
            const attestationData = attestation.data;

            // Check for placement indicators in the attestation data
            // The data field contains hex-encoded ABI data
            const dataLower = attestationData.toLowerCase();

            // Check for winner status (highest priority)
            if (dataLower.includes('winner') || dataLower.includes('01') ||
                dataLower.includes('1st') || dataLower.includes('first')) {
              score += 50; // Winner score
            }
            // Check for finalist status
            else if (dataLower.includes('finalist') || dataLower.includes('02') ||
                     dataLower.includes('2nd') || dataLower.includes('second') ||
                     dataLower.includes('3rd') || dataLower.includes('third')) {
              score += 30; // Finalist score
            }
            // Default to submission
            else {
              score += 20; // Base submission score
            }
          } catch (parseError) {
            // If parsing fails, default to submission score
            score += 20;
          }
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
