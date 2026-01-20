import type { Address } from 'viem';

export interface WalletLinkRequest {
  readonly primaryAddress: Address;
  readonly walletToLink: Address;
  readonly signature: string;
  readonly message: {
    readonly main: Address;
    readonly secondary: Address;
    readonly nonce: string | bigint;
    readonly deadline: string | bigint;
  };
}

export interface WalletLinkResponse {
  readonly success: boolean;
  readonly walletId?: string;
  readonly error?: string;
}

export interface LinkedWallet {
  readonly id: string;
  readonly address: Address;
  readonly linkedAt: Date;
}
