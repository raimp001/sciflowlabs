/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Prevent webpack from bundling native/ESM-only CDP packages
  serverExternalPackages: [
    '@coinbase/agentkit',
    '@coinbase/agentkit-vercel-ai-sdk',
    '@coinbase/coinbase-sdk',
    '@coinbase/cdp-sdk',
  ],
}

export default nextConfig
