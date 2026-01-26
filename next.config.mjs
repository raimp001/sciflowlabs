/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Build errors should not be ignored in production
    ignoreBuildErrors: false,
  },
  eslint: {
    // Run ESLint during builds
    ignoreDuringBuilds: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
