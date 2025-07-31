/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@product-analytics/ui', '@product-analytics/types'],
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3002',
  },
};

module.exports = nextConfig;