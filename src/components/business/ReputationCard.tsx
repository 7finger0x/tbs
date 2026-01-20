'use client';

import { Card } from '@/components/ui/Card';
import type { ReputationData } from '@/types/reputation';
import { formatAddress } from '@/lib/utils';
import { Trophy, TrendingUp } from 'lucide-react';

interface ReputationCardProps {
  reputation: ReputationData;
  address: string;
}

const tierColors: Record<ReputationData['tier'], string> = {
  TOURIST: 'text-gray-500',
  RESIDENT: 'text-blue-500',
  BUILDER: 'text-purple-500',
  BASED: 'text-orange-500',
  LEGEND: 'text-yellow-500',
};

const tierGradients: Record<ReputationData['tier'], string> = {
  TOURIST: 'from-gray-100 to-gray-200',
  RESIDENT: 'from-blue-100 to-blue-200',
  BUILDER: 'from-purple-100 to-purple-200',
  BASED: 'from-orange-100 to-orange-200',
  LEGEND: 'from-yellow-100 to-yellow-200',
};

export function ReputationCard({ reputation, address }: ReputationCardProps) {
  return (
    <Card className={`bg-gradient-to-br ${tierGradients[reputation.tier]}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Address</p>
          <p className="font-mono text-sm font-medium text-gray-900">
            {formatAddress(address as `0x${string}`)}
          </p>
        </div>
        <Trophy className={`w-8 h-8 ${tierColors[reputation.tier]}`} />
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-5xl font-bold ${tierColors[reputation.tier]}`}>
            {reputation.totalScore}
          </span>
          <span className="text-gray-500 text-lg">/ 1000</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-semibold ${tierColors[reputation.tier]}`}>
            {reputation.tier}
          </span>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-300">
        <p className="text-xs text-gray-500">
          Last calculated: {reputation.lastCalculated.toLocaleDateString()}
        </p>
      </div>
    </Card>
  );
}
