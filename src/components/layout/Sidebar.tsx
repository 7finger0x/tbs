'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { ChevronRight } from 'lucide-react';

interface NavLink {
  href: string;
  label: string;
  hasChevron?: boolean;
}

const navLinks: NavLink[] = [
  { href: '/reputation', label: 'Reputation' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/tiers', label: 'Tiers', hasChevron: true },
  { href: '/metrics', label: 'Metrics', hasChevron: true },
  { href: '/about', label: 'About', hasChevron: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isConnected, address } = useAccount();

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo and Title */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <img
              src="/assets/logo.png"
              alt="The Base Standard Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-lg font-bold text-gray-900">The Base Standard</h1>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span>{link.label}</span>
                  {link.hasChevron && (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* START HERE Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <span className="text-xs font-medium text-gray-500 uppercase">
            START HERE
          </span>
        </div>

        <div className="space-y-3">
          {isConnected && address ? (
            <Link
              href="/reputation"
              className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              View Your Score
            </Link>
          ) : (
            <div className="bg-blue-600 text-white text-center py-3 px-4 rounded-md font-medium">
              <ConnectWallet />
            </div>
          )}

          <Link
            href="/reputation"
            className="block w-full bg-white border border-gray-300 text-gray-700 text-center py-3 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            Manage Wallets
          </Link>
        </div>
      </div>
    </div>
  );
}
