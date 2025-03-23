/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    SUPADATA_API_KEY: process.env.SUPADATA_API_KEY,
  },
  experimental: {
    serverActions: true,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'Authorization, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/supadata/:path*',
        destination: 'https://api.supadata.dev/:path*',
      },
    ];
  },
  serverRuntimeConfig: {
    SUPADATA_API_KEY: process.env.SUPADATA_API_KEY,
  },
  publicRuntimeConfig: {
    apiUrl: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'your_production_url_here',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
