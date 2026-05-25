/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  // Static export for Cloudflare Pages hosting (no Node server runtime).
  output: 'export',
  // Required when using `output: 'export'` — disables the built-in image
  // optimizer (which needs a Node server). next/image still works, it just
  // serves the source file directly.
  images: { unoptimized: true },
};

export default nextConfig;
