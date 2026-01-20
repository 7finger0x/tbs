'use client';

import { Sidebar } from './Sidebar';
import { useAccount } from 'wagmi';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { chain } = useAccount();

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 overflow-auto tbs-app-bg">
        {/* Network Indicator */}
        <div className="sticky top-0 z-10 tbs-surface border-b border-gray-200 px-6 py-3 flex justify-end">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {chain?.name || 'Base L2'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="tbs-surface rounded-2xl border border-white/40 shadow-sm p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
