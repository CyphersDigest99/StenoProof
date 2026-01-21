/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Increase timeout for API routes handling large files
  serverRuntimeConfig: {
    maxDuration: 300, // 5 minutes
  },
};

module.exports = nextConfig;
