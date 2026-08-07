import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'linkedin-jobs-api'],
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
}

export default nextConfig
