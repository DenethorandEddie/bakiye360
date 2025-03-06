/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: ['wemufsahwsnmeyuedczw.supabase.co'],
  },
  experimental: {
    serverActions: true,
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
};

export default nextConfig;