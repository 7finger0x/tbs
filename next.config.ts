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
      
      // Ignore React Native imports from MetaMask SDK
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
      };
    }
    
    // External dependencies that shouldn't be bundled
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Ignore warnings about React Native imports (MetaMask SDK)
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Can't resolve '@react-native-async-storage\/async-storage'/,
    ];
    
    return config;
  },
};

export default nextConfig;
