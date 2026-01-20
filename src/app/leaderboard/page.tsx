import { MainLayout } from '@/components/layout/MainLayout';

export default function LeaderboardPage() {
  // TODO: Implement leaderboard with actual data
  const mockLeaderboard = [
    { rank: 1, address: '0x0001...0000', score: 1000, tier: 'LEGEND' },
    { rank: 2, address: '0x0002...0000', score: 1000, tier: 'LEGEND' },
    { rank: 3, address: '0x0003...0000', score: 1000, tier: 'LEGEND' },
    { rank: 4, address: '0x0004...0000', score: 1000, tier: 'LEGEND' },
    { rank: 5, address: '0x0005...0000', score: 1000, tier: 'LEGEND' },
  ];

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'LEGEND':
        return 'bg-yellow-400 text-gray-900';
      case 'BASED':
        return 'bg-blue-400 text-white';
      case 'BUILDER':
        return 'bg-purple-400 text-white';
      case 'RESIDENT':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Leaderboard</h1>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RANK
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ADDRESS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SCORE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TIER
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockLeaderboard.map((entry) => (
                <tr key={entry.rank} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getRankDisplay(entry.rank)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                    {entry.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {entry.score.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getTierBadgeColor(
                        entry.tier
                      )}`}
                    >
                      {entry.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
