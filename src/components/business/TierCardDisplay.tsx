'use client';

import { TierCard } from './TierCard';
import type { ReputationTier } from '@/types/reputation';
import { TIER_THRESHOLDS } from '@/lib/constants';

interface TierCardDisplayProps {
  currentScore?: number;
  currentTier?: ReputationTier;
  showMintButtons?: boolean;
  onMint?: (tier: ReputationTier) => void;
}

const tierOrder: ReputationTier[] = ['LEGEND', 'BASED', 'BUILDER', 'RESIDENT', 'TOURIST'];

export function TierCardDisplay({
  currentScore,
  currentTier,
  showMintButtons = false,
  onMint,
}: TierCardDisplayProps) {
  const isEligibleForTier = (tier: ReputationTier): boolean => {
    if (currentScore === undefined) return false;
    const threshold = TIER_THRESHOLDS[tier];
    return currentScore >= threshold.min;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {tierOrder.map((tier) => (
        <TierCard
          key={tier}
          tier={tier}
          score={currentScore}
          showMintButton={showMintButtons}
          isEligible={isEligibleForTier(tier)}
          onMint={() => onMint?.(tier)}
        />
      ))}
    </div>
  );
}
