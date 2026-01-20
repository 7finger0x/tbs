import { ReputationDashboard } from '@/components/business/ReputationDashboard';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            The Base Standard
          </h1>
          <p className="text-lg text-gray-600">
            Your verifiable reputation on Base L2
          </p>
        </div>
        <ReputationDashboard />
      </div>
    </main>
  );
}
