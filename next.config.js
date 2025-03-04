/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for development
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // ws modülü için uyarıları gizle
    config.ignoreWarnings = [
      { module: /node_modules\/ws/ }
    ];
    return config;
  },
};

module.exports = nextConfig;