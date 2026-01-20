import 'server-only';
import type { MetricScore, ScoreInput } from '@/types/reputation';
import { METRIC_WEIGHTS } from '@/lib/constants';
import { getFarcasterUserByAddress, getFarcasterGraph, calculateOpenRank } from '@/lib/scoring/social/farcaster-api';
import { buildFarcasterSocialGraph, calculateEigenTrust, calculateSocialGraphScore } from '@/lib/scoring/social/eigentrust';
import type { Address } from 'viem';
import { normalizeAddress } from '@/lib/utils';

/**
 * Calculate Farcaster Social Score
 * 
 * Scoring components:
 * - Linked FID: 50 points base
 * - OpenRank Top 10%: +100 points
 * - OpenRank Top 20%: +75 points
 * - OpenRank Top 50%: +50 points
 * - EigenTrust social graph score: up to 100 points
 * - Follower count: logarithmic scale up to 50 points
 */
export async function calculateFarcaster(input: ScoreInput): Promise<MetricScore> {
  const maxScore = METRIC_WEIGHTS.FARCASTER * 10; // 150 max
  const address = input.address as Address;
  const normalizedAddress = normalizeAddress(address);
  
  try {
    // Get Farcaster user by verified address
    const farcasterUser = await getFarcasterUserByAddress(normalizedAddress);
    
    if (!farcasterUser || !farcasterUser.fid) {
      return {
        name: 'Farcaster',
        score: 0,
        weight: METRIC_WEIGHTS.FARCASTER,
        maxScore,
      };
    }
    
    // Base score for having a linked FID
    let score = 50;
    
    // Calculate OpenRank and percentile
    const { openRank, percentile } = await calculateOpenRank(farcasterUser.fid);
    
    // OpenRank percentile bonuses
    if (percentile >= 90) {
      score += 100; // Top 10%
    } else if (percentile >= 75) {
      score += 75; // Top 25%
    } else if (percentile >= 50) {
      score += 50; // Top 50%
    } else if (percentile >= 25) {
      score += 25; // Top 75%
    }
    
    // Get social graph for EigenTrust calculation
    const graph = await getFarcasterGraph(farcasterUser.fid);
    
    if (graph) {
      // Week 3: Full EigenTrust integration
      // Build complete social graph node for EigenTrust calculation
      const socialNode = buildFarcasterSocialGraph(
        farcasterUser.fid,
        graph.follows,
        graph.followers,
        graph.mentions
      );
      
      // Calculate EigenTrust score
      // Note: For full EigenTrust, we'd need the entire graph
      // For now, calculate local EigenTrust score from this node's relationships
      // In production, this would query a pre-computed EigenTrust index
      const trustScores = calculateEigenTrust([socialNode]);
      const socialGraphScore = calculateSocialGraphScore(
        trustScores,
        socialNode.id,
        0.1 // Top 10% threshold
      );
      
      // Add EigenTrust-based score (up to 50 points)
      score += Math.round(socialGraphScore * 0.5);
      
      // Also add engagement metrics as bonus
      const mutualFollows = graph.follows.filter((fid) =>
        graph.followers.includes(fid)
      ).length;
      const engagementBonus = Math.min(25, (mutualFollows / Math.max(1, graph.follows.length)) * 25);
      score += Math.round(engagementBonus);
    }
    
    // Follower count bonus (logarithmic scale)
    const followerCount = farcasterUser.followerCount || 0;
    const followerScore = Math.min(50, Math.log10(followerCount + 1) * 10);
    score += Math.round(followerScore);
    
    // Cap at max score
    const finalScore = Math.min(score, maxScore);
    
    return {
      name: 'Farcaster',
      score: finalScore,
      weight: METRIC_WEIGHTS.FARCASTER,
      maxScore,
    };
  } catch (error) {
    console.error('Error calculating Farcaster score:', error);
    return {
      name: 'Farcaster',
      score: 0,
      weight: METRIC_WEIGHTS.FARCASTER,
      maxScore,
    };
  }
}
