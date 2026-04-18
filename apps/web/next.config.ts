import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /** One Node resolution for `zod` so `z.config({ customError })` applies to workspace schemas. */
  serverExternalPackages: ['zod'],
  experimental: {
    optimizePackageImports: ['@repo/react-common', 'react-icons'],
  },
};

export default nextConfig;
