/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript hataları deployment'ı engellemeyecek
  typescript: {
    ignoreBuildErrors: true,
  },
  // ESLint hataları deployment'ı engellemeyecek
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