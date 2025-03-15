/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: ['wemufsahwsnmeyuedczw.supabase.co', 'i.pravatar.cc', 'images.unsplash.com'],
  },
  experimental: {
    serverActions: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: false,
  webpack: (config) => {
    config.optimization = {
      ...config.optimization,
      minimize: false
    };
    
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
  trailingSlash: false
};

module.exports = nextConfig;