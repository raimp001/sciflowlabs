/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/123',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig