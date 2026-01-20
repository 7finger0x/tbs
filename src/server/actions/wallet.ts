'use server';

import { z } from 'zod';
import { linkWallet, getUserByAddress, createUser } from '@/lib/db/queries';
import type { Address } from 'viem';
import { normalizeAddress } from '@/lib/utils';
import type { WalletLinkResponse } from '@/types/wallet';
import { 
  verifyEIP712LinkSignature, 
  validateLinkMessage, 
  type EIP712LinkMessage 
} from '@/lib/identity/eip712-linking';
// Environment variable helper
function getEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

const walletLinkSchema = z.object({
  primaryAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid primary address'),
  walletToLink: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  signature: z.string().min(1, 'Signature is required'),
  message: z.object({
    main: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    secondary: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    nonce: z.string().or(z.bigint()),
    deadline: z.string().or(z.bigint()),
  }),
});

export async function linkWalletAction(
  input: z.infer<typeof walletLinkSchema>
): Promise<WalletLinkResponse> {
  try {
    const validated = walletLinkSchema.parse(input);
    const primaryAddress = normalizeAddress(validated.primaryAddress as Address);
    const walletToLink = normalizeAddress(validated.walletToLink as Address);

    // Get or create user
    let user = await getUserByAddress(primaryAddress);
    if (!user) {
      user = await createUser(primaryAddress);
    }

    // Parse message
    const linkMessage: EIP712LinkMessage = {
      main: normalizeAddress(validated.message.main as Address),
      secondary: normalizeAddress(validated.message.secondary as Address),
      nonce: typeof validated.message.nonce === 'string' ? BigInt(validated.message.nonce) : validated.message.nonce,
      deadline: typeof validated.message.deadline === 'string' ? BigInt(validated.message.deadline) : validated.message.deadline,
    };

    // Validate message structure
    const validation = validateLinkMessage(linkMessage);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid link message',
      };
    }

    // Verify addresses match
    if (linkMessage.main.toLowerCase() !== primaryAddress.toLowerCase()) {
      return {
        success: false,
        error: 'Primary address mismatch',
      };
    }

    if (linkMessage.secondary.toLowerCase() !== walletToLink.toLowerCase()) {
      return {
        success: false,
        error: 'Secondary address mismatch',
      };
    }

    // Get chain ID and contract address from environment
    const chainId = parseInt(getEnv('NEXT_PUBLIC_CHAIN_ID', '8453'), 10);
    const verifyingContract = getEnv('NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS', '0x0000000000000000000000000000000000000000') as Address;

    // Verify EIP-712 signature
    const signatureValid = await verifyEIP712LinkSignature(
      linkMessage,
      validated.signature as `0x${string}`,
      walletToLink, // Secondary wallet should have signed
      chainId,
      verifyingContract
    );

    if (!signatureValid) {
      return {
        success: false,
        error: 'Invalid EIP-712 signature',
      };
    }

    // Link wallet with verified signature
    const wallet = await linkWallet(user.id, walletToLink, validated.signature);

    return {
      success: true,
      walletId: wallet.id,
    };
  } catch (error) {
    console.error('Error linking wallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
