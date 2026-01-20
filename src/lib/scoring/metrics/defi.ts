import 'server-only';
import type { MetricScore, ScoreInput } from '@/types/reputation';
import { METRIC_WEIGHTS } from '@/lib/constants';
import { getDefiMetrics, upsertDefiMetrics } from '@/lib/db/queries';
import { createBaseClient } from '@/lib/chain/base-client';
import type { Address } from 'viem';

/**
 * Protocol registry for Base DeFi protocols
 * Maps contract addresses to protocol names and categories
 */
const PROTOCOL_REGISTRY: Record<string, { name: string; category: string; deployedAt: number }> = {
  // DEX
  '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24': { name: 'Uniswap V3', category: 'DEX', deployedAt: 1690848000 }, // ~2023-08-01
  '0x03a520b32c04bf3beef7beb72e919cf822ed34f1': { name: 'Aerodrome', category: 'DEX', deployedAt: 1696000000 },
  '0x9409280dc1e6d33ab7a8c6ec03e5763fb61772b5': { name: 'BaseSwap', category: 'DEX', deployedAt: 1694000000 },
  
  // Lending
  '0x4e80cece1f57f08bf47c2cbc8d8f1e5d8b5c9d5b': { name: 'Aave V3', category: 'Lending', deployedAt: 1696000000 },
  '0xbb505c54d71e9e599cb8435b4f0ceec05fc71cbd': { name: 'Morpho', category: 'Lending', deployedAt: 1695000000 },
  
  // Bridge
  '0x4200000000000000000000000000000000000010': { name: 'Base Bridge', category: 'Bridge', deployedAt: 1690000000 },
  
  // Staking
  '0x4b48841d4b32c4650e4abc117a03fe8b51f3f964': { name: 'Stakewise', category: 'Staking', deployedAt: 1697000000 },
  
  // NFT Marketplace
  '0x04e2516a2c207e84a1839755675dfd8ef6302f0a': { name: 'Zora', category: 'NFT', deployedAt: 1680000000 },
  
  // Add more protocols as needed
};

/**
 * Determine capital tier based on volume
 */
function getCapitalTier(volumeUSD: number): string {
  if (volumeUSD >= 100000) return 'high';
  if (volumeUSD >= 10000) return 'mid';
  return 'low';
}

/**
 * Calculate DeFi Metrics Score
 * Tracks protocol diversity, vintage contracts, and interaction volume
 */
export async function calculateDefiMetrics(input: ScoreInput): Promise<MetricScore> {
  const maxScore = 100; // Base score for DeFi activity
  const address = input.address as Address;
  
  try {
    // Check for cached DeFi metrics first
    let metrics = await getDefiMetrics(address);
    
    if (!metrics) {
      // Analyze transactions to collect DeFi metrics
      const { analyzeTransactions } = await import('../economic/transaction-analysis');
      const analysis = await analyzeTransactions(address);
      
      // Convert Sets to Arrays for storage
      const protocolCategories = Array.from(analysis.protocolCategories);
      
      // Calculate capital tier from volume
      const capitalTier = getCapitalTier(analysis.totalVolumeUSD);
      
      // Persist metrics and use the returned Prisma model (includes id)
      metrics = await upsertDefiMetrics(address, {
        uniqueProtocols: analysis.uniqueProtocols.size,
        vintageContracts: analysis.vintageContracts,
        protocolCategories,
        totalInteractions: analysis.transactionCount,
        gasUsedETH: analysis.gasUsedETH,
        volumeUSD: analysis.totalVolumeUSD,
        liquidityDurationDays: 0, // Would need to track liquidity positions
        liquidityPositions: 0,
        lendingUtilization: 0, // Would need to query lending protocols
        capitalTier,
      });
    }
    
    // Calculate score based on DeFi activity
    // 10 points per unique protocol (max 30 points for 3+ protocols)
    const protocolScore = Math.min(metrics.uniqueProtocols * 10, 30);
    
    // 5 points per vintage contract (max 15 points for 3+ vintage contracts)
    const vintageScore = Math.min(metrics.vintageContracts * 5, 15);
    
    // Category diversity: 5 points per category (max 25 points for 5+ categories)
    const categories = (() => {
      try {
        return JSON.parse(metrics.protocolCategories) as string[];
      } catch {
        return [];
      }
    })();
    const categoryScore = Math.min(categories.length * 5, 25);
    
    // Volume tier bonus: 10 points for mid tier, 20 for high tier
    const volumeBonus = metrics.capitalTier === 'high' ? 20 : metrics.capitalTier === 'mid' ? 10 : 0;
    
    // Interaction activity: 1 point per 10 interactions (max 30 points)
    const interactionScore = Math.min(Math.floor(metrics.totalInteractions / 10), 30);
    
    const score = Math.min(
      protocolScore + vintageScore + categoryScore + volumeBonus + interactionScore,
      maxScore
    );
    
    return {
      name: 'DeFi Metrics',
      score,
      weight: 10, // Add to METRIC_WEIGHTS if needed
      maxScore,
    };
  } catch (error) {
    console.error('Error calculating DeFi metrics:', error);
    return {
      name: 'DeFi Metrics',
      score: 0,
      weight: 10,
      maxScore,
    };
  }
}
