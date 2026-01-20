import 'server-only';
import type { ReputationData, ScoreInput, MetricScore } from '@/types/reputation';
import { TIER_THRESHOLDS } from '@/lib/constants';
import { calculateBaseTenure } from './metrics/baseTenure';
import { calculateZoraMints } from './metrics/zoraMints';
import { calculateTimeliness } from './metrics/timeliness';
import { calculateFarcaster } from './metrics/farcaster';
import { calculateBuilder } from './metrics/builder';
import { calculateCreator } from './metrics/creator';
import { calculateOnchainSummer } from './metrics/onchainSummer';
import { calculateHackathon } from './metrics/hackathon';
import { calculateEarlyAdopter } from './metrics/earlyAdopter';
import { calculateDefiMetrics } from './metrics/defi';
import { upsertEconomicVector } from '@/lib/db/queries';
import { calculateSybilResistance } from '@/lib/identity/sybil-resistance';
import type { Address } from 'viem';

/**
 * Calculate economic vector pillars from metrics
 */
async function calculateEconomicVector(
  metrics: MetricScore[],
  totalScore: number,
  address: Address
): Promise<{
  capitalPillar: number;
  diversityPillar: number;
  identityPillar: number;
  multiplier: number;
  breakdown: Record<string, unknown>;
}> {
  // Capital Pillar: Based on volume, gas, builder activity, DeFi participation
  const builderScore = metrics.find((m) => m.name === 'Builder')?.score ?? 0;
  const creatorScore = metrics.find((m) => m.name === 'Creator')?.score ?? 0;
  const defiScore = metrics.find((m) => m.name === 'DeFi Metrics')?.score ?? 0;
  
  // Week 2: Get transaction analysis for volume and whale resistance
  let volumeScore = 0;
  let whaleResistanceScore = 0;
  let capitalDeploymentScore = 0;
  
  try {
    const { analyzeTransactions, calculateWhaleResistanceScore, calculateCapitalDeploymentScore } = 
      await import('./economic/transaction-analysis');
    
    const analysis = await analyzeTransactions(address);
    
    // Apply whale resistance to volume
    whaleResistanceScore = calculateWhaleResistanceScore(analysis.totalVolumeUSD);
    
    // Calculate capital deployment score
    // Note: liquidityDurationDays would come from DeFi metrics if tracked
    const { getDefiMetrics } = await import('@/lib/db/queries');
    const defiMetrics = await getDefiMetrics(address);
    const liquidityDays = defiMetrics?.liquidityDurationDays ?? 0;
    capitalDeploymentScore = calculateCapitalDeploymentScore(
      analysis.capitalDeployed,
      liquidityDays
    );
    
    // Volume contributes to capital pillar (with whale resistance applied)
    volumeScore = Math.min(100, whaleResistanceScore);
  } catch (error) {
    // If analysis fails, continue without volume scoring
    console.error('Error in transaction analysis:', error);
  }
  
  // Week 2: Capital pillar combines: builder, creator, DeFi, volume (with whale resistance)
  // Max 400 points
  const capitalPillar = Math.min(
    builderScore * 1.2 + 
    creatorScore * 1.2 + 
    defiScore * 1.5 + 
    volumeScore * 0.8 +
    capitalDeploymentScore * 0.5,
    400
  );

  // Diversity Pillar: Based on DeFi metrics and protocol diversity
  const zoraScore = metrics.find((m) => m.name === 'Zora Mints')?.score ?? 0;
  const diversityPillar = Math.min((defiScore + zoraScore) * 3, 300);

  // Identity Pillar: Based on social proof and attestations
  const farcasterScore = metrics.find((m) => m.name === 'Farcaster')?.score ?? 0;
  const earlyAdopterScore = metrics.find((m) => m.name === 'Early Adopter')?.score ?? 0;
  const identityPillar = Math.min((farcasterScore + earlyAdopterScore) * 2, 300);

  // Base multiplier: Based on early adopter and hackathon status
  let multiplier = 1.0;
  if (earlyAdopterScore > 0) multiplier += 0.1;
  const hackathonScore = metrics.find((m) => m.name === 'Hackathon')?.score ?? 0;
  if (hackathonScore > 0) multiplier += 0.1;
  
  // Add Sybil resistance multiplier (Week 4)
  // This will be calculated and applied separately in calculateReputation

  const breakdown = {
    capital: {
      builder: builderScore,
      creator: creatorScore,
      defi: defiScore,
      volume: volumeScore,
      whaleResistance: whaleResistanceScore,
      capitalDeployment: capitalDeploymentScore,
      total: capitalPillar,
    },
    diversity: {
      defi: defiScore,
      zora: zoraScore,
      total: diversityPillar,
    },
    identity: {
      farcaster: farcasterScore,
      earlyAdopter: earlyAdopterScore,
      total: identityPillar,
    },
    multiplier,
    totalScore,
  };

  return {
    capitalPillar,
    diversityPillar,
    identityPillar,
    multiplier,
    breakdown,
  };
}

export async function calculateReputation(input: ScoreInput): Promise<ReputationData> {
  // Execute all metric calculations in parallel
  const metricPromises = [
    calculateBaseTenure(input),
    calculateZoraMints(input),
    calculateTimeliness(input),
    calculateFarcaster(input), // Week 3: Enhanced with EigenTrust/OpenRank
    calculateBuilder(input),
    calculateCreator(input),
    calculateOnchainSummer(input),
    calculateHackathon(input),
    calculateEarlyAdopter(input),
    calculateDefiMetrics(input),
  ];

  const metrics = await Promise.all(metricPromises);

  // Calculate base total score (before multipliers)
  const baseScore = metrics.reduce((sum, metric) => sum + metric.score, 0);
  
  // Calculate economic vector (without Sybil multiplier yet)
  const economicVector = await calculateEconomicVector(metrics, baseScore, input.address as Address);
  
  // Week 4: Calculate Sybil resistance multiplier
  const sybilResistance = await calculateSybilResistance(
    input.address as Address,
    undefined // userId would be passed if available
  );
  
  // Apply Sybil resistance multiplier to economic vector multiplier
  const finalMultiplier = Math.min(
    1.7, // Maximum total multiplier
    economicVector.multiplier * sybilResistance.multiplier
  );
  
  // Calculate final total score with multipliers
  const totalScore = Math.min(
    1000,
    Math.floor(baseScore * finalMultiplier)
  );
  
  // Determine tier based on score
  const tier = determineTier(totalScore);
  
  // Update economic vector breakdown with Sybil resistance info
  const enhancedBreakdown = {
    ...economicVector.breakdown,
    sybilResistance: {
      multiplier: sybilResistance.multiplier,
      factors: sybilResistance.factors,
      breakdown: sybilResistance.breakdown,
    },
    finalMultiplier,
  };
  
  // Persist economic vector to database
  await upsertEconomicVector(input.address as Address, {
    capitalPillar: economicVector.capitalPillar,
    diversityPillar: economicVector.diversityPillar,
    identityPillar: economicVector.identityPillar,
    totalScore,
    multiplier: finalMultiplier,
    breakdown: enhancedBreakdown,
  }).catch((error) => {
    // Log but don't fail if persistence fails
    console.error('Failed to persist economic vector:', error);
  });
  
  return {
    totalScore,
    tier,
    metrics,
    lastCalculated: new Date(),
  };
}

function determineTier(score: number): ReputationData['tier'] {
  if (score >= TIER_THRESHOLDS.LEGEND.min) return 'LEGEND';
  if (score >= TIER_THRESHOLDS.BASED.min) return 'BASED';
  if (score >= TIER_THRESHOLDS.BUILDER.min) return 'BUILDER';
  if (score >= TIER_THRESHOLDS.RESIDENT.min) return 'RESIDENT';
  return 'TOURIST';
}
