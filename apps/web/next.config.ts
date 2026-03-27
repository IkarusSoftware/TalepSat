import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@talepsat/ui', '@talepsat/tokens', '@talepsat/schemas', '@talepsat/utils'],
  serverExternalPackages: ['better-sqlite3', '@prisma/adapter-better-sqlite3', 'pg', '@prisma/adapter-pg'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
