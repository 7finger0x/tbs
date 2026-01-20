'use client';

import { useState } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatAddress, normalizeAddress } from '@/lib/utils';
import { linkWalletAction } from '@/server/actions/wallet';
import { createLinkMessage, getEIP712Domain, LINK_WALLET_TYPES } from '@/lib/identity/eip712-client';
import type { Address } from 'viem';
import { Check, X, Link2 } from 'lucide-react';

interface LinkedWallet {
  address: Address;
  linkedAt: Date;
}

interface WalletLinkingProps {
  primaryAddress: Address;
  linkedWallets?: LinkedWallet[];
  onWalletLinked?: () => void;
}

export function WalletLinking({ primaryAddress, linkedWallets = [], onWalletLinked }: WalletLinkingProps) {
  const { address: connectedAddress } = useAccount();
  const [walletToLink, setWalletToLink] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '8453', 10);
  const verifyingContract = (process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS || 
    '0x0000000000000000000000000000000000000000') as Address;

  const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();

  const handleLinkWallet = async () => {
    if (!walletToLink || !connectedAddress) {
      setError('Please enter a wallet address and connect a wallet');
      return;
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletToLink)) {
      setError('Invalid wallet address format');
      return;
    }

    const walletToLinkNormalized = normalizeAddress(walletToLink as Address);
    const primaryNormalized = normalizeAddress(primaryAddress);

    // Check if wallet is already linked
    if (linkedWallets.some((w) => w.address.toLowerCase() === walletToLinkNormalized.toLowerCase())) {
      setError('This wallet is already linked');
      return;
    }

    // Check if trying to link primary wallet
    if (walletToLinkNormalized.toLowerCase() === primaryNormalized.toLowerCase()) {
      setError('Cannot link primary wallet to itself');
      return;
    }

    setIsLinking(true);
    setError(null);
    setSuccess(false);

    try {
      // Create EIP-712 message
      const nonce = BigInt(Date.now());
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now
      const linkMessage = createLinkMessage(
        primaryNormalized,
        walletToLinkNormalized,
        nonce,
        3600
      );

      // Get domain
      const domain = getEIP712Domain(chainId, verifyingContract);

      // Sign the typed data
      const signature = await signTypedDataAsync({
        domain,
        types: LINK_WALLET_TYPES,
        primaryType: 'LinkWallet',
        message: linkMessage,
      });

      // Call server action to link wallet
      const result = await linkWalletAction({
        primaryAddress: primaryNormalized,
        walletToLink: walletToLinkNormalized,
        signature,
        message: {
          main: linkMessage.main,
          secondary: linkMessage.secondary,
          nonce: linkMessage.nonce.toString(),
          deadline: linkMessage.deadline.toString(),
        },
      });

      if (result.success) {
        setSuccess(true);
        setWalletToLink('');
        if (onWalletLinked) {
          onWalletLinked();
        }
        // Reset success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Failed to link wallet');
      }
    } catch (err) {
      console.error('Error linking wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to link wallet');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Card className="mt-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Link Additional Wallets</h3>
        </div>

        <p className="text-sm text-gray-600">
          Link additional wallets to your primary wallet to include their on-chain activity in your reputation score.
        </p>

        {linkedWallets.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Linked Wallets:</p>
            <div className="space-y-1">
              {linkedWallets.map((wallet) => (
                <div
                  key={wallet.address}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm"
                >
                  <Check className="w-4 h-4 text-green-600" />
                  <code className="text-gray-800">{formatAddress(wallet.address)}</code>
                  <span className="text-xs text-gray-500">
                    Linked {new Date(wallet.linkedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="wallet-address" className="block text-sm font-medium text-gray-700">
            Wallet Address to Link
          </label>
          <div className="flex gap-2">
            <input
              id="wallet-address"
              type="text"
              value={walletToLink}
              onChange={(e) => {
                setWalletToLink(e.target.value);
                setError(null);
                setSuccess(false);
              }}
              placeholder="0x..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <Button
              onClick={handleLinkWallet}
              disabled={isLinking || isSigning || !walletToLink || !connectedAddress}
              className="whitespace-nowrap"
            >
              {isLinking || isSigning ? 'Linking...' : 'Link Wallet'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            <X className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
            <Check className="w-4 h-4" />
            <span>Wallet linked successfully!</span>
          </div>
        )}

        {!connectedAddress && (
          <p className="text-sm text-amber-600">
            Please connect a wallet to link additional wallets.
          </p>
        )}
      </div>
    </Card>
  );
}
