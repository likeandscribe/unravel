/** @type {import('next').NextConfig} */
const nextConfig = {
  // FIXME: Remove this when we're closer to production
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
