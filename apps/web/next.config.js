/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Emit a self-contained server bundle for the Docker runtime stage.
  output: 'standalone',
  async rewrites() {
    // Proxy /api/* to the API service so relative /api calls work in
    // local dev. In production, prefer setting NEXT_PUBLIC_API_URL and
    // calling it directly via lib/api.ts.
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
