import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@talepsat/ui', '@talepsat/tokens', '@talepsat/schemas', '@talepsat/utils'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
