import { MainLayout } from '@/components/layout/MainLayout';
import { MetricInfo } from '@/components/business/MetricInfo';

export default function MetricsPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          How We Calculate Your Score
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your reputation score is calculated from multiple on-chain metrics. Each metric contributes to your total score up to 1,000 points.
        </p>

        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Total Score: 0-1,000 points
          </h2>
          <p className="text-gray-700">
            Your tier is determined by your total score across all metrics. Connect your wallet to see your personalized breakdown.
          </p>
        </div>

        <MetricInfo />
      </div>
    </MainLayout>
  );
}
