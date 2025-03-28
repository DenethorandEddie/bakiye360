/** @type {import('next').NextConfig} */

const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['wemufsahwsnmeyuedczw.supabase.co', 'i.pravatar.cc', 'images.unsplash.com', 'images.pexels.com', 'pexels.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wemufsahwsnmeyuedczw.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: false,
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    return config;
  },
  trailingSlash: false,
  // Rewrites özelleştirmesi
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
        // CORS sorunları için API isteklerinde özel konfigürasyon - API istekleri için domain farkını tolere et
        has: [
          {
            type: 'header',
            key: 'origin',
          },
        ],
      },
    ];
  },
  // CORS ile ilgili diğer sorunlar için middleware
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;