'use client';

import Image from 'next/image';
import type { ReputationTier } from '@/types/reputation';
import { TIER_THRESHOLDS } from '@/lib/constants';

interface TierCardProps {
  tier: ReputationTier;
  score?: number;
  showMintButton?: boolean;
  onMint?: () => void;
  isEligible?: boolean;
}

const tierConfig: Record<
  ReputationTier,
  {
    image: string;
    name: string;
    description: string;
    mintPrice: string;
    benefits: string[];
  }
> = {
  TOURIST: {
    image: '/assets/tier-novice.png',
    name: 'TOURIST',
    description: 'New to Base. Start your journey and build your reputation!',
    mintPrice: '0.001 ETH',
    benefits: ['Basic access', 'Community participation', 'Activity tracking'],
  },
  RESIDENT: {
    image: '/assets/tier-bronze.png',
    name: 'RESIDENT',
    description: 'Established presence on Base with consistent activity.',
    mintPrice: '0.002 ETH',
    benefits: [
      'Standard rewards',
      'Basic multipliers',
      'Community access',
      'Activity tracking',
    ],
  },
  BUILDER: {
    image: '/assets/tier-silver.png',
    name: 'BUILDER',
    description: 'Active contributor to the Base ecosystem.',
    mintPrice: '0.003 ETH',
    benefits: [
      'Builder tools access',
      'Event invites',
      'Network perks',
      'Collaboration opportunities',
    ],
  },
  BASED: {
    image: '/assets/tier-gold.png',
    name: 'BASED',
    description: 'Top 5% of Base users. Highly engaged community member.',
    mintPrice: '0.005 ETH',
    benefits: [
      'Premium features',
      'Bonus multipliers',
      'Community recognition',
      'Special badges',
    ],
  },
  LEGEND: {
    image: '/assets/tier-based.png',
    name: 'LEGEND',
    description: 'Top 1% of Base users. Elite status with maximum rewards and exclusive access.',
    mintPrice: '0.010 ETH',
    benefits: [
      'Exclusive NFT drops',
      'Governance voting power',
      'Priority support',
      'Early access to features',
    ],
  },
};

export function TierCard({
  tier,
  score,
  showMintButton = false,
  onMint,
  isEligible = false,
}: TierCardProps) {
  const config = tierConfig[tier];
  const threshold = TIER_THRESHOLDS[tier];
  const scoreRange = `${threshold.min}${threshold.max < 1000 ? `-${threshold.max}` : '+'}`;

  return (
    <div className="relative group">
      <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl">
        <Image
          src={config.image}
          alt={`${config.name} Tier Card`}
          fill
          className="object-cover"
          priority
        />
        
        {/* Overlay with tier info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 flex flex-col justify-end">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300 uppercase tracking-wider">
                {config.name}
              </span>
              <span className="text-xs text-gray-300">
                {scoreRange} pts
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-1">
              {config.name}
            </h3>
            
            <p className="text-sm text-gray-300 mb-4">
              {config.description}
            </p>

            {showMintButton && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Mint Price:</span>
                  <span className="text-white font-semibold">{config.mintPrice}</span>
                </div>
                {score !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Your Score:</span>
                    <span className="text-white font-semibold">{score}</span>
                  </div>
                )}
                
                {isEligible ? (
                  <button
                    onClick={onMint}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Mint NFT
                  </button>
                ) : (
                  <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-md">
                    <p className="text-xs text-yellow-200 text-center">
                      {score !== undefined
                        ? 'Your reputation score is not high enough to mint this tier NFT yet.'
                        : 'Connect your wallet to check eligibility.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
