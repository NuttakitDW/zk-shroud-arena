import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if ESLint errors are present
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if TypeScript errors are present
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true
  },
  transpilePackages: ['leaflet', 'react-leaflet'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Only alias the JS part, not the CSS
      config.resolve.alias = {
        ...config.resolve.alias,
        'leaflet$': 'leaflet/dist/leaflet-src.esm.js',
      };
    }
    return config;
  },
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8080'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
