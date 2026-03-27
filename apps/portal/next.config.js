/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3001']
    }
  },
  // Suppress punycode deprecation warning
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, punycode: false }
    return config
  }
}

module.exports = nextConfig
