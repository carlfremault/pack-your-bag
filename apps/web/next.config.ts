import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@repo/react-common', 'react-icons'],
  },
};

export default nextConfig;
