import { MainLayout } from '@/components/layout/MainLayout';
import { TierInfo } from '@/components/business/TierInfo';
import Link from 'next/link';

export default function TiersPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Reputation Tiers</h1>
            <p className="text-lg text-gray-600">
              Your tier is determined by your reputation score. Higher tiers unlock more benefits and recognition in the Base ecosystem.
            </p>
          </div>
          <Link
            href="/tiers/mint"
            className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Mint Tier NFT
          </Link>
        </div>

        <TierInfo />
      </div>
    </MainLayout>
  );
}
