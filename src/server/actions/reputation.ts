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

    // Get or create user
    let user = await getUserByAddress(normalized);
    if (!user) {
      user = await createUser(normalized);
    }

    // Get linked wallets
    const linkedWallets = user.wallets.map((w) => w.address);

    // Calculate reputation
    const reputationData = await calculateReputation({
      address: normalized,
      linkedWallets,
    });

    // Persist to database
    await upsertReputation(user.id, reputationData);

    return {
      success: true,
      data: reputationData,
    };
  } catch (error) {
    console.error('Error calculating reputation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
