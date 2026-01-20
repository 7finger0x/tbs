'use server';

import { z } from 'zod';
import { calculateReputation } from '@/lib/scoring/calculator';
import { getUserByAddress, createUser, upsertReputation } from '@/lib/db/queries';
import type { Address } from 'viem';
import { normalizeAddress } from '@/lib/utils';
import type { ReputationApiResponse } from '@/types/api';

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address');

export async function getReputationAction(
  address: string
): Promise<ReputationApiResponse> {
  try {
    const validatedAddress = addressSchema.parse(address);
    const normalized = normalizeAddress(validatedAddress as Address);

    // Get or create user (gracefully handle database connection errors)
    let user = await getUserByAddress(normalized);
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
    const linkedWallets = user.wallets.map((w) => w.address);

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
