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
  // Derleme hatalarını engellemek için
  swcMinify: false,
  webpack: (config, { isServer }) => {
    // ws modülü için uyarıları gizle
    config.ignoreWarnings = [
      { module: /node_modules\/ws/ }
    ];
    config.optimization.minimize = false;
    return config;
  },
};

module.exports = nextConfig;