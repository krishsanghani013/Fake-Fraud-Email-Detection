/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents duplicate double-mount in dev mode for faster page rendering
  compress: true,
  poweredByHeader: false,
  transpilePackages: ['framer-motion'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      '@clerk/nextjs',
      'clsx',
      'tailwind-merge'
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
