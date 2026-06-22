/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Emit a self-contained server bundle for the Docker runtime stage.
  output: 'standalone',
  async redirects() {
    // The auth pages live in the (auth) route group, so they serve at
    // /login, /register, /signup. Redirect the intuitive /auth/* URLs there.
    return [
      { source: '/auth', destination: '/login', permanent: false },
      { source: '/auth/:page', destination: '/:page', permanent: false },
    ];
  },
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
