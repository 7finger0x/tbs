import { MainLayout } from '@/components/layout/MainLayout';

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About The Base Standard</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-lg text-gray-700">
            The Base Standard is an open protocol for verifiable on-chain reputation. We believe that your contributions to the blockchain ecosystem should be recognized, rewarded, and portable across platforms.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">1. Connect Your Wallet</h3>
              <p className="text-gray-700">
                Link your Ethereum wallet to start building your reputation profile. We analyze your on-chain activity across Base and other supported networks.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">2. Build Your Score</h3>
              <p className="text-gray-700">
                Your reputation score is calculated from multiple metrics including tenure, transaction activity, NFT mints, and early adoption bonuses.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">3. Earn Your Tier</h3>
              <p className="text-gray-700">
                As your score grows, you advance through tiers from Tourist to Legend. Each tier unlocks new benefits and recognition in the ecosystem.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">4. Prove Your Reputation</h3>
              <p className="text-gray-700">
                Use your verified reputation across protocols, DAOs, and applications. Your on-chain history becomes a portable credential.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Built on Base</h2>
          <p className="text-lg text-gray-700">
            The Base Standard is built on Base, Coinbase's Ethereum L2. Base provides fast, low-cost transactions while maintaining the security of Ethereum. Our smart contracts are fully audited and open source.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Join the Community</h2>
          <p className="text-lg text-gray-700">
            The Base Standard is community-driven. Join us to help shape the future of on-chain reputation.
          </p>
        </section>
      </div>
    </MainLayout>
  );
}
