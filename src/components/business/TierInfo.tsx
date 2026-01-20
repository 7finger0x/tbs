'use client';

import type { ReputationTier } from '@/types/reputation';
import { TIER_THRESHOLDS } from '@/lib/constants';

interface TierDetails {
  tier: ReputationTier;
  name: string;
  subtitle: string;
  description: string;
  badgeColor: string;
  benefits: string[];
}

const tierDetails: TierDetails[] = [
  {
    tier: 'LEGEND',
    name: 'LEGEND',
    subtitle: 'Top 1% Ecosystem Leaders',
    description: 'Top 1% of Base users. Elite status with maximum rewards and exclusive access.',
    badgeColor: 'bg-yellow-400 text-gray-900',
    benefits: [
      'Exclusive NFT drops',
      'Governance voting power',
      'Priority support',
      'Early access to features',
    ],
  },
  {
    tier: 'BASED',
    name: 'BASED',
    subtitle: 'Top 5% Elite (Hard Gate)',
    description: 'Top 5% of Base users. Highly engaged community member.',
    badgeColor: 'bg-blue-400 text-white',
    benefits: [
      'Premium features',
      'Bonus multipliers',
      'Community recognition',
      'Special badges',
    ],
  },
  {
    tier: 'BUILDER',
    name: 'BUILDER',
    subtitle: 'Power Users with Diversity',
    description: 'Active contributor to the Base ecosystem.',
    badgeColor: 'bg-purple-400 text-white',
    benefits: [
      'Builder tools access',
      'Event invites',
      'Network perks',
      'Collaboration opportunities',
    ],
  },
  {
    tier: 'RESIDENT',
    name: 'RESIDENT',
    subtitle: 'Average Active Users',
    description: 'Established presence on Base with consistent activity.',
    badgeColor: 'bg-yellow-500 text-white',
    benefits: [
      'Standard rewards',
      'Basic multipliers',
      'Community access',
      'Activity tracking',
    ],
  },
  {
    tier: 'TOURIST',
    name: 'TOURIST',
    subtitle: 'Low Retention / One-time',
    description: 'New to Base. Start your journey and build your reputation!',
    badgeColor: 'bg-gray-400 text-white',
    benefits: [
      'Basic access',
      'Community participation',
      'Activity tracking',
    ],
  },
];

export function TierInfo() {
  return (
    <div className="space-y-6">
      {tierDetails.map((tier) => {
        const threshold = TIER_THRESHOLDS[tier.tier];
        const scoreRange = `${threshold.min}${threshold.max < 1000 ? `-${threshold.max}` : '+'}`;

        return (
          <div
            key={tier.tier}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${tier.badgeColor}`}
                >
                  {tier.name}
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
                  <p className="text-sm text-gray-500">{tier.subtitle}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  Score: {scoreRange}
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{tier.description}</p>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Benefits:</h4>
              <div className="grid grid-cols-2 gap-2">
                {tier.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-blue-600">•</span>
                    <span className="text-sm text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
