'use client';

import { useAccount } from 'wagmi';
import { WalletConnect } from './WalletConnect';
import { ReputationCard } from './ReputationCard';
import { MetricCard } from './MetricCard';
import { useReputation } from '@/lib/hooks/useReputation';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export function ReputationDashboard() {
  const { address, isConnected } = useAccount();
  const { data: reputation, isLoading, error } = useReputation(address);

  if (!isConnected) {
    return <WalletConnect />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Calculating reputation...</span>
      </div>
    );
  }

  if (error || !reputation) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">
          {error?.message || 'Failed to load reputation data'}
        </p>
      </div>
    );
  }

  if (!address) {
    return <WalletConnect />;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Reputation</h1>
          {reputation.totalScore > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {((reputation.totalScore / 1000) * 100).toFixed(1)}% Multiplier
            </div>
          )}
        </div>

        <ErrorBoundary>
          <ReputationCard reputation={reputation} address={address} />
        </ErrorBoundary>
        
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Score Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reputation.metrics.map((metric) => (
              <ErrorBoundary
                key={metric.name}
                fallback={
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      Failed to load metric: {metric.name}
                    </p>
                  </div>
                }
              >
                <MetricCard metric={metric} />
              </ErrorBoundary>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
