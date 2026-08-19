/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export → deployable to Namecheap public_html via cPanel/FTP.
  output: "export",
  // next/image optimizer needs a server; static export ships raw images instead.
  images: { unoptimized: true },
  // Emit /solutions/index.html style folders so Apache serves clean URLs.
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
