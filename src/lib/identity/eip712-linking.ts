import 'server-only';
import type { Address } from 'viem';
import { recoverTypedDataAddress } from 'viem';
import { normalizeAddress } from '@/lib/utils';
import type { EIP712LinkMessage } from './eip712-client';
import { getEIP712Domain, LINK_WALLET_TYPES } from './eip712-client';

/**
 * EIP-712 Wallet Linking Verification (Server-Only)
 * 
 * Verifies EIP-712 typed data signatures for wallet linking.
 * Provides cryptographic proof of wallet ownership.
 * 
 * For client-safe utilities (createLinkMessage, getEIP712Domain, etc.),
 * see ./eip712-client.ts
 */

// Re-export types and constants for server-side use
export type { EIP712LinkMessage } from './eip712-client';
export { getEIP712Domain, LINK_WALLET_TYPES } from './eip712-client';

/**
 * Verify EIP-712 signature for wallet linking
 * 
 * @param message - The typed data message
 * @param signature - The signature to verify
 * @param expectedSigner - The address that should have signed
 * @param chainId - Chain ID for domain
 * @param verifyingContract - Contract address for domain
 * @returns true if signature is valid
 */
export async function verifyEIP712LinkSignature(
  message: EIP712LinkMessage,
  signature: `0x${string}`,
  expectedSigner: Address,
  chainId: number,
  verifyingContract: Address
): Promise<boolean> {
  try {
    const domain = getEIP712Domain(chainId, verifyingContract);
    
    // Recover signer from signature
    const recoveredAddress = await recoverTypedDataAddress({
      domain,
      types: LINK_WALLET_TYPES,
      primaryType: 'LinkWallet',
      message,
      signature,
    });
    
    // Normalize addresses for comparison
    const normalizedExpected = normalizeAddress(expectedSigner);
    const normalizedRecovered = normalizeAddress(recoveredAddress);
    
    return normalizedExpected === normalizedRecovered;
  } catch (error) {
    console.error('Error verifying EIP-712 signature:', error);
    return false;
  }
}

/**
 * Verify signature deadline hasn't expired
 */
export function verifyDeadline(deadline: bigint): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return deadline > now;
}

/**
 * Validate EIP-712 wallet link message
 */
export function validateLinkMessage(message: EIP712LinkMessage): {
  valid: boolean;
  error?: string;
} {
  // Check deadline
  if (!verifyDeadline(message.deadline)) {
    return {
      valid: false,
      error: 'Signature deadline has expired',
    };
  }
  
  // Check addresses are different
  if (message.main.toLowerCase() === message.secondary.toLowerCase()) {
    return {
      valid: false,
      error: 'Cannot link wallet to itself',
    };
  }
  
  // Validate addresses
  if (!message.main.match(/^0x[a-fA-F0-9]{40}$/)) {
    return {
      valid: false,
      error: 'Invalid main wallet address',
    };
  }
  
  if (!message.secondary.match(/^0x[a-fA-F0-9]{40}$/)) {
    return {
      valid: false,
      error: 'Invalid secondary wallet address',
    };
  }
  
  // Validate nonce
  if (message.nonce < 0n) {
    return {
      valid: false,
      error: 'Invalid nonce',
    };
  }
  
  return { valid: true };
}

/**
 * Create EIP-712 typed data for wallet linking (server-side)
 * Note: Client components should use the client-safe version from ./eip712-client.ts
 */
export function createLinkMessage(
  main: Address,
  secondary: Address,
  nonce: bigint,
  deadlineSeconds: number = 3600
): EIP712LinkMessage {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineSeconds);
  
  return {
    main: normalizeAddress(main),
    secondary: normalizeAddress(secondary),
    nonce,
    deadline,
  };
}
