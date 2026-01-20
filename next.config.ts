import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Force Next.js to transpile viem and wagmi packages
  // This helps with ESM module resolution issues
  transpilePackages: ['viem', 'wagmi', '@wagmi/connectors'],
  webpack: (config, { isServer }) => {
    // Exclude Prisma from client bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // External dependencies that shouldn't be bundled
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    return config;
  },
};

export default nextConfig;
