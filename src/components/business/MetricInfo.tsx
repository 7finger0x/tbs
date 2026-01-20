'use client';

import { BarChart3, Zap, TrendingUp, Users, Code, Sparkles, Trophy, Award, Rocket } from 'lucide-react';

interface Metric {
  name: string;
  weight: number;
  maxScore: number;
  description: string;
  icon: React.ReactNode;
}

const metrics: Metric[] = [
  {
    name: 'BASE TENURE',
    weight: 25,
    maxScore: 250,
    description: 'Days since your first transaction on Base L2. Longer tenure demonstrates commitment to the ecosystem.',
    icon: <BarChart3 className="w-6 h-6" />,
  },
  {
    name: 'ZORA MINTS',
    weight: 25,
    maxScore: 250,
    description: 'NFTs minted on Zora. Rewards creators and collectors who actively participate in the NFT ecosystem.',
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    name: 'TRANSACTION ACTIVITY',
    weight: 20,
    maxScore: 200,
    description: 'Your overall transaction history on Base. More activity shows deeper engagement.',
    icon: <Zap className="w-6 h-6" />,
  },
  {
    name: 'EARLY ADOPTER',
    weight: 15,
    maxScore: 150,
    description: 'Bonus multipliers for being among the first to engage with new collections and protocols.',
    icon: <Rocket className="w-6 h-6" />,
  },
  {
    name: 'CONTRACT INTERACTIONS',
    weight: 15,
    maxScore: 150,
    description: 'Unique smart contracts you have interacted with. Diversity of usage indicates expertise.',
    icon: <Code className="w-6 h-6" />,
  },
];

export function MetricInfo() {
  return (
    <div className="space-y-6">
      {metrics.map((metric) => (
        <div
          key={metric.name}
          className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
              {metric.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">{metric.name}</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  {metric.weight}% weight
                </span>
              </div>
              <p className="text-gray-600 mb-2">{metric.description}</p>
              <p className="text-sm text-gray-500">
                Maximum contribution: {metric.maxScore} points
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
