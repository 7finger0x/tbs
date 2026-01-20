'use client';

import type { Address } from 'viem';
import { normalizeAddress } from '@/lib/utils';

/**
 * EIP-712 Client-Safe Utilities
 * 
 * These functions can be used in client components for creating
 * EIP-712 messages and types. Verification functions remain server-only.
 */

export interface EIP712LinkMessage {
  main: Address;
  secondary: Address;
  nonce: bigint;
  deadline: bigint;
}

/**
 * EIP-712 Domain Separator
 * Matches the domain used in the smart contract
 */
export function getEIP712Domain(chainId: number, verifyingContract: Address) {
  return {
    name: 'The Base Standard',
    version: '1',
    chainId,
    verifyingContract,
  };
}

/**
 * EIP-712 Types for LinkWallet
 */
export const LINK_WALLET_TYPES = {
  LinkWallet: [
    { name: 'main', type: 'address' },
    { name: 'secondary', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

/**
 * Create EIP-712 typed data for wallet linking
 * Client-safe version
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
