'use server';

import { z } from 'zod';
import { calculateReputation } from '@/lib/scoring/calculator';
import { getUserByAddress, createUser, upsertReputation } from '@/lib/db/queries';
import type { Address } from 'viem';
import { normalizeAddress } from '@/lib/utils';
import type { ReputationApiResponse } from '@/types/api';

import { METRIC_WEIGHTS } from '@/lib/constants';
import type { ReputationTier } from '@/types/reputation';

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address');

export async function getReputationAction(
  address: string,
  forceRefresh?: boolean
): Promise<ReputationApiResponse> {
  try {
    const validatedAddress = addressSchema.parse(address);
    const normalized = normalizeAddress(validatedAddress as Address);

    // Get or create user (gracefully handle database connection errors)
    let user = await getUserByAddress(normalized);

    // Check for cached reputation
    if (user?.reputation && !forceRefresh) {
      const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
      const now = new Date();
      const lastCalculated = new Date(user.reputation.lastCalculated);

      if (now.getTime() - lastCalculated.getTime() < CACHE_DURATION) {
        // Reconstruct items from DB
        const metrics = [
          { name: 'Base Tenure', score: user.reputation.baseTenureScore, weight: METRIC_WEIGHTS.BASE_TENURE, maxScore: METRIC_WEIGHTS.BASE_TENURE * 10 },
          { name: 'Zora Mints', score: user.reputation.zoraMintsScore, weight: METRIC_WEIGHTS.ZORA_MINTS, maxScore: METRIC_WEIGHTS.ZORA_MINTS * 10 },
          { name: 'Timeliness', score: user.reputation.timelinessScore, weight: METRIC_WEIGHTS.TIMELINESS, maxScore: METRIC_WEIGHTS.TIMELINESS * 10 },
          { name: 'Farcaster', score: user.reputation.farcasterScore, weight: METRIC_WEIGHTS.FARCASTER, maxScore: METRIC_WEIGHTS.FARCASTER * 10 },
          { name: 'Builder', score: user.reputation.builderScore, weight: METRIC_WEIGHTS.BUILDER, maxScore: METRIC_WEIGHTS.BUILDER * 10 },
          { name: 'Creator', score: user.reputation.creatorScore, weight: METRIC_WEIGHTS.CREATOR, maxScore: METRIC_WEIGHTS.CREATOR * 10 },
          { name: 'Onchain Summer', score: user.reputation.onchainSummerScore, weight: METRIC_WEIGHTS.ONCHAIN_SUMMER, maxScore: METRIC_WEIGHTS.ONCHAIN_SUMMER * 10 },
          { name: 'Hackathon', score: user.reputation.hackathonScore, weight: METRIC_WEIGHTS.HACKATHON, maxScore: METRIC_WEIGHTS.HACKATHON * 10 },
          { name: 'Early Adopter', score: user.reputation.earlyAdopterScore, weight: METRIC_WEIGHTS.EARLY_ADOPTER, maxScore: METRIC_WEIGHTS.EARLY_ADOPTER * 10 },
        ];

        return {
          success: true,
          data: {
            totalScore: user.reputation.totalScore,
            tier: user.reputation.tier as ReputationTier,
            metrics,
            lastCalculated: user.reputation.lastCalculated,
          },
        };
      }
    }

    if (!user) {
      try {
        user = await createUser(normalized);
      } catch (error) {
        // If database is unavailable, calculate reputation without persistence
        if (error instanceof Error && error.message.includes('Database unavailable')) {
          console.warn('Database unavailable, calculating reputation without persistence');

          // Calculate reputation with empty linked wallets
          const reputationData = await calculateReputation({
            address: normalized,
            linkedWallets: [],
          });

          return {
            success: true,
            data: reputationData,
          };
        }
        throw error;
      }
    }

    // Get linked wallets
    const linkedWallets = user.wallets.map((w: { address: string }) => w.address);

    // Calculate reputation
    const reputationData = await calculateReputation({
      address: normalized,
      linkedWallets,
    });

    // Persist to database (gracefully handle connection errors)
    try {
      await upsertReputation(user.id, reputationData);
    } catch (error) {
      // Log but don't fail if database is unavailable
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (
          errorMessage.includes('can\'t reach database server') ||
          errorMessage.includes('authentication failed') ||
          errorMessage.includes('database credentials') ||
          errorMessage.includes('connection')
        ) {
          console.warn('Database unavailable, reputation calculated but not persisted');
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    return {
      success: true,
      data: reputationData,
    };
  } catch (error) {
    // Safely log error (handle null/undefined)
    if (error != null) {
      console.error('Error calculating reputation:', error);
    } else {
      console.error('Error calculating reputation: Unknown error (null/undefined)');
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error ?? 'Unknown error occurred'),
    };
  }
}
