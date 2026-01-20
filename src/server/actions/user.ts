'use server';

import { z } from 'zod';
import { getUserByAddress } from '@/lib/db/queries';
import { normalizeAddress } from '@/lib/utils';
import type { Address } from 'viem';

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address');

export interface LinkedWalletInfo {
  address: Address;
  linkedAt: Date;
}

export interface UserWithWallets {
  primaryAddress: Address;
  linkedWallets: LinkedWalletInfo[];
}

/**
 * Get user with linked wallets
 */
export async function getUserWithWallets(
  address: string
): Promise<{ success: boolean; data?: UserWithWallets; error?: string }> {
  try {
    const validatedAddress = addressSchema.parse(address);
    const normalized = normalizeAddress(validatedAddress as Address);

    const user = await getUserByAddress(normalized);

    if (!user) {
      return {
        success: true,
        data: {
          primaryAddress: normalized,
          linkedWallets: [],
        },
      };
    }

    return {
      success: true,
      data: {
        primaryAddress: normalized,
        linkedWallets: user.wallets.map((w) => ({
          address: w.address as Address,
          linkedAt: w.linkedAt,
        })),
      },
    };
  } catch (error) {
    console.error('Error fetching user with wallets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
