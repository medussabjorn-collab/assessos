/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server-rendered on Railway (see Dockerfile/start.js) — standalone output
  // bundles a minimal server + only the deps actually needed at runtime.
  output: "standalone",
  reactStrictMode: true,
};

export default nextConfig;
