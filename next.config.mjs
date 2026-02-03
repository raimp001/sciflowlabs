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
  // Headers for Farcaster Frame / Base Mini App embedding
  async headers() {
    return [
      {
        // Allow all pages to be embedded in frames
        source: '/:path*',
        headers: [
          {
            // Remove X-Frame-Options to allow embedding
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            // Content Security Policy for frames
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://warpcast.com https://*.farcaster.xyz https://*.base.org https://base.org *;",
          },
        ],
      },
      {
        // Static files headers
        source: '/(.*)\\.(png|jpg|jpeg|gif|ico|svg|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // .well-known files must be accessible
        source: '/.well-known/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ]
  },
}

export default nextConfig
