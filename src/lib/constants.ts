import type { ReputationTier } from '@/types/reputation';

// Chain IDs
export const CHAIN_IDS = {
  BASE_MAINNET: 8453,
  BASE_SEPOLIA: 84532,
} as const;

// Tier Thresholds (0-1000 scale)
export const TIER_THRESHOLDS: Record<ReputationTier, { min: number; max: number }> = {
  TOURIST: { min: 0, max: 350 },
  RESIDENT: { min: 351, max: 650 },
  BUILDER: { min: 651, max: 850 },
  BASED: { min: 851, max: 950 },
  LEGEND: { min: 951, max: 1000 },
} as const;

// Metric Weights (Total should sum to reasonable distribution)
export const METRIC_WEIGHTS = {
  BASE_TENURE: 15,
  ZORA_MINTS: 12,
  TIMELINESS: 8,
  FARCASTER: 15,
  BUILDER: 20,
  CREATOR: 10,
  ONCHAIN_SUMMER: 8,
  HACKATHON: 7,
  EARLY_ADOPTER: 5,
} as const;
