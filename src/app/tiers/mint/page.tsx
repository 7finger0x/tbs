'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { TierCardDisplay } from '@/components/business/TierCardDisplay';
import { useAccount } from 'wagmi';
import { useReputation } from '@/lib/hooks/useReputation';

function MintPageContent() {
  const { address, isConnected } = useAccount();
  const { data: reputation } = useReputation(address);

  const handleMint = (tier: string) => {
    // TODO: Implement NFT minting logic
    console.log(`Minting ${tier} tier NFT for address:`, address);
    // This would call a smart contract function to mint the NFT
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Mint Your Tier NFT</h1>
      <p className="text-lg text-gray-600 mb-8">
        Immortalize your achievement on-chain. Mint an NFT representing your tier status in The Base Standard reputation system.
      </p>

      {isConnected && reputation && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Your Reputation Score</p>
              <p className="text-3xl font-bold text-blue-900">{reputation.totalScore}</p>
            </div>
            <span className="text-sm text-blue-600">Connected</span>
          </div>
        </div>
      )}

      <TierCardDisplay
        currentScore={reputation?.totalScore}
        currentTier={reputation?.tier}
        showMintButtons={true}
        onMint={handleMint}
      />

      <div className="mt-12 p-6 bg-purple-50 border border-purple-200 rounded-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">About Tier NFTs</h2>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-1">•</span>
            <span>
              <strong>Permanent Record:</strong> Your tier NFT is a permanent on-chain record of your achievement in The Base Standard ecosystem.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-1">•</span>
            <span>
              <strong>Eligibility:</strong> You must meet the minimum score requirement to mint a tier NFT. Keep building your reputation to unlock higher tiers!
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-1">•</span>
            <span>
              <strong>Collectible:</strong> Each tier has a unique design featuring The Base Standard logo and your tier status.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-1">•</span>
            <span>
              <strong>Future Utility:</strong> Tier NFTs may unlock exclusive benefits, governance rights, and special access in future ecosystem developments.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function MintPage() {
  return (
    <MainLayout>
      <MintPageContent />
    </MainLayout>
  );
}
