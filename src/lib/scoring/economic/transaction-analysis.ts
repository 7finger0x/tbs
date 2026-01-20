import 'server-only';
import type { Address } from 'viem';
import { createBaseClient } from '@/lib/chain/base-client';
import { getTransactionCache, createTransactionRecord } from '@/lib/db/queries';
import { normalizeAddress } from '@/lib/utils';

/**
 * Transaction Volume Analysis
 * Analyzes transaction history to calculate volume, DeFi participation, and capital deployment
 * Uses BaseScan API for accurate transaction data when available, falls back to estimates
 */

export interface TransactionAnalysis {
  totalVolumeETH: number;
  totalVolumeUSD: number;
  defiVolumeUSD: number;
  uniqueProtocols: Set<string>;
  protocolCategories: Set<string>;
  vintageContracts: number;
  gasUsedETH: number;
  capitalDeployed: number; // Total value locked in protocols
  transactionCount: number;
}

/**
 * Fetch actual transaction data from BaseScan API
 */
async function fetchActualTransactions(address: Address): Promise<{
  transactions: any[];
  totalVolumeETH: number;
  gasUsedETH: number;
  protocolInteractions: Map<string, number>;
} | null> {
  try {
    const basescanApiKey = process.env.BASESCAN_API_KEY;

    if (!basescanApiKey) {
      return null; // Fall back to estimation
    }

    // Fetch normal transactions
    const txUrl = `https://api.basescan.org/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${basescanApiKey}`;

    const response = await fetch(txUrl, { next: { revalidate: 3600 } }); // Cache for 1 hour
    const data = await response.json();

    if (data.status !== '1' || !data.result) {
      return null;
    }

    const transactions = data.result;
    let totalVolumeWei = 0n;
    let totalGasUsedWei = 0n;
    const protocolInteractions = new Map<string, number>();

    // Process transactions to calculate actual values
    for (const tx of transactions) {
      // Calculate volume (only count outgoing transactions from this address)
      if (tx.from.toLowerCase() === address.toLowerCase()) {
        const value = BigInt(tx.value || 0);
        totalVolumeWei += value;

        // Track gas used
        const gasUsed = BigInt(tx.gasUsed || 0);
        const gasPrice = BigInt(tx.gasPrice || 0);
        totalGasUsedWei += gasUsed * gasPrice;

        // Track protocol interactions
        const toAddress = tx.to?.toLowerCase();
        if (toAddress && PROTOCOL_ADDRESSES[toAddress]) {
          const currentCount = protocolInteractions.get(toAddress) || 0;
          protocolInteractions.set(toAddress, currentCount + 1);
        }
      }
    }

    // Convert Wei to ETH (1 ETH = 10^18 Wei)
    const totalVolumeETH = Number(totalVolumeWei) / 1e18;
    const gasUsedETH = Number(totalGasUsedWei) / 1e18;

    return {
      transactions,
      totalVolumeETH,
      gasUsedETH,
      protocolInteractions,
    };
  } catch (error) {
    return null; // Fall back to estimation on error
  }
}

/**
 * Protocol registry for identifying DeFi interactions
 */
const PROTOCOL_ADDRESSES: Record<string, { name: string; category: string; deployedAt: number }> = {
  // DEX
  '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24': { name: 'Uniswap V3', category: 'DEX', deployedAt: 1690848000 },
  '0x03a520b32c04bf3beef7beb72e919cf822ed34f1': { name: 'Aerodrome', category: 'DEX', deployedAt: 1696000000 },
  '0x9409280dc1e6d33ab7a8c6ec03e5763fb61772b5': { name: 'BaseSwap', category: 'DEX', deployedAt: 1694000000 },
  
  // Lending
  '0xa238dd80c259a72e81d7e4664a9801593f98d1c5': { name: 'Aave V3', category: 'Lending', deployedAt: 1696000000 },
  '0xbb505c54d71e9e599cb8435b4f0ceec05fc71cbd': { name: 'Morpho', category: 'Lending', deployedAt: 1695000000 },
  
  // Bridge
  '0x4200000000000000000000000000000000000010': { name: 'Base Bridge', category: 'Bridge', deployedAt: 1690000000 },
  
  // Add more as needed
};

/**
 * Analyze transactions for an address
 * Uses cached data when available, otherwise fetches from RPC
 */
export async function analyzeTransactions(address: Address): Promise<TransactionAnalysis> {
  const normalizedAddress = normalizeAddress(address);
  const client = createBaseClient();

  // Check cache first
  const cached = await getTransactionCache(normalizedAddress);

  // Initialize analysis
  const analysis: TransactionAnalysis = {
    totalVolumeETH: 0,
    totalVolumeUSD: 0,
    defiVolumeUSD: 0,
    uniqueProtocols: new Set(),
    protocolCategories: new Set(),
    vintageContracts: 0,
    gasUsedETH: 0,
    capitalDeployed: 0,
    transactionCount: cached?.transactionCount || 0,
  };

  // Try to fetch actual transaction data from BaseScan API
  const actualData = await fetchActualTransactions(normalizedAddress);

  // Fetch ETH price (with fallback)
  let estimatedETHPrice = 2500; // Default fallback
  try {
    // Try to fetch from CoinGecko or similar (would cache this)
    // For now, use default
  } catch {
    // Use fallback
  }

  if (actualData) {
    // Use actual transaction data
    analysis.transactionCount = actualData.transactions.length;
    analysis.totalVolumeETH = actualData.totalVolumeETH;
    analysis.totalVolumeUSD = actualData.totalVolumeETH * estimatedETHPrice;
    analysis.gasUsedETH = actualData.gasUsedETH;

    // Process protocol interactions
    const now = Math.floor(Date.now() / 1000);
    const oneYearAgo = now - 31536000;

    for (const [protocolAddr, interactionCount] of actualData.protocolInteractions) {
      const protocol = PROTOCOL_ADDRESSES[protocolAddr];
      if (protocol) {
        analysis.uniqueProtocols.add(protocolAddr);
        analysis.protocolCategories.add(protocol.category);

        // Check if vintage (deployed >1 year ago)
        if (protocol.deployedAt < oneYearAgo) {
          analysis.vintageContracts++;
        }
      }
    }

    // Calculate DeFi volume from actual protocol interactions
    const defiTransactions = Array.from(actualData.protocolInteractions.values()).reduce((sum, count) => sum + count, 0);
    const defiPercentage = analysis.transactionCount > 0 ? defiTransactions / analysis.transactionCount : 0;
    analysis.defiVolumeUSD = analysis.totalVolumeUSD * defiPercentage;

    // Estimate capital deployed (for DeFi users)
    if (analysis.defiVolumeUSD > 0) {
      const capitalDeploymentRatio = defiPercentage > 0.5 ? 0.3 : 0.15;
      analysis.capitalDeployed = analysis.defiVolumeUSD * capitalDeploymentRatio;
    }
  } else {
    // Fall back to estimation if API is unavailable
    let avgTxValueETH = 0.005; // Base average

    if (analysis.transactionCount > 1000) {
      avgTxValueETH = 0.05;
    } else if (analysis.transactionCount > 500) {
      avgTxValueETH = 0.02;
    } else if (analysis.transactionCount > 100) {
      avgTxValueETH = 0.01;
    } else if (analysis.transactionCount > 50) {
      avgTxValueETH = 0.008;
    }

    analysis.totalVolumeETH = analysis.transactionCount * avgTxValueETH;
    analysis.totalVolumeUSD = analysis.totalVolumeETH * estimatedETHPrice;

    const defiPercentage = analysis.transactionCount > 100 ? 0.5 : 0.3;
    analysis.defiVolumeUSD = analysis.totalVolumeUSD * defiPercentage;

    const avgGasPerTx = analysis.transactionCount > 100 ? 0.002 : 0.001;
    analysis.gasUsedETH = analysis.transactionCount * avgGasPerTx;

    // Estimate protocol interactions
    const protocolAddresses = Object.keys(PROTOCOL_ADDRESSES);
    const now = Math.floor(Date.now() / 1000);
    const oneYearAgo = now - 31536000;

    if (analysis.transactionCount > 0) {
      const estimatedProtocolCount = Math.min(
        protocolAddresses.length,
        Math.max(1, Math.floor(Math.log10(analysis.transactionCount + 1) * 2))
      );

      const protocolList = Object.entries(PROTOCOL_ADDRESSES);
      const selectedProtocols = protocolList
        .sort((a, b) => {
          if (analysis.transactionCount > 100) {
            return a[1].deployedAt - b[1].deployedAt;
          }
          return Math.random() - 0.5;
        })
        .slice(0, estimatedProtocolCount);

      for (const [protocolAddr, protocol] of selectedProtocols) {
        analysis.uniqueProtocols.add(protocolAddr);
        analysis.protocolCategories.add(protocol.category);

        if (protocol.deployedAt < oneYearAgo) {
          analysis.vintageContracts++;
        }
      }

      if (analysis.defiVolumeUSD > 0) {
        const capitalDeploymentRatio = analysis.transactionCount > 200 ? 0.3 : 0.15;
        analysis.capitalDeployed = analysis.defiVolumeUSD * capitalDeploymentRatio;
      }
    }
  }

  return analysis;
}

/**
 * Calculate whale resistance score
 * Uses logarithmic scaling to prevent whale dominance
 */
export function calculateWhaleResistanceScore(volumeUSD: number): number {
  // Logarithmic formula: log10(volumeUSD + 1) * 10
  // This prevents whales from dominating while still rewarding volume
  return Math.min(100, Math.log10(volumeUSD + 1) * 10);
}

/**
 * Calculate capital deployment score
 * Rewards users who deploy capital in protocols (liquidity, lending, etc.)
 */
export function calculateCapitalDeploymentScore(
  capitalDeployed: number,
  liquidityDurationDays: number
): number {
  let score = 0;
  
  // Base score from capital deployed (logarithmic)
  score += Math.min(50, Math.log10(capitalDeployed + 1) * 5);
  
  // Duration bonus
  if (liquidityDurationDays >= 30) {
    score += 50; // Long-term commitment bonus
  } else if (liquidityDurationDays >= 7) {
    score += 25; // Medium-term bonus
  }
  
  return Math.min(100, score);
}
