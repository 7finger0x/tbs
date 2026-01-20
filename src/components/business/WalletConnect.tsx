'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatAddress } from '@/lib/utils';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { WalletLinking } from './WalletLinking';
import { useEffect, useState } from 'react';
import { getUserWithWallets, type LinkedWalletInfo } from '@/server/actions/user';
import type { Address } from 'viem';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [linkedWallets, setLinkedWallets] = useState<LinkedWalletInfo[]>([]);

  // Fetch linked wallets when address changes
  useEffect(() => {
    if (address) {
      getUserWithWallets(address)
        .then((result) => {
          if (result.success && result.data) {
            setLinkedWallets(result.data.linkedWallets);
          }
        })
        .catch(console.error);
    } else {
      setLinkedWallets([]);
    }
  }, [address]);

  const handleWalletLinked = async () => {
    if (address) {
      const result = await getUserWithWallets(address);
      if (result.success && result.data) {
        setLinkedWallets(result.data.linkedWallets);
      }
    }
  };

  if (isConnected && address) {
    return (
      <div className="space-y-4">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Connected Wallet</p>
            <p className="font-mono text-lg font-semibold text-gray-900">
              {formatAddress(address)}
            </p>
          </div>
          <Button variant="outline" onClick={() => disconnect()}>
            Disconnect
          </Button>
        </Card>
        <WalletLinking 
          primaryAddress={address} 
          linkedWallets={linkedWallets}
          onWalletLinked={handleWalletLinked}
        />
      </div>
    );
  }

  return (
    <Card>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600 mb-4">
          Connect your Base wallet to view your reputation score
        </p>
        <ConnectWallet />
      </div>
    </Card>
  );
}
