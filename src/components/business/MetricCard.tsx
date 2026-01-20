'use client';

import { Card } from '@/components/ui/Card';
import type { MetricScore } from '@/types/reputation';

interface MetricCardProps {
  metric: MetricScore;
}

export function MetricCard({ metric }: MetricCardProps) {
  const percentage = (metric.score / metric.maxScore) * 100;

  return (
    <Card className="hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{metric.name}</h3>
        <span className="text-sm font-medium text-gray-600">
          {metric.score} / {metric.maxScore}
        </span>
      </div>
      
      <div className="mb-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      
      <p className="text-xs text-gray-500">
        Weight: {metric.weight}%
      </p>
    </Card>
  );
}
