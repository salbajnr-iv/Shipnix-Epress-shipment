/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['qrcode'],
  },
  allowedDevOrigins: ['*.replit.dev', '*.spock.replit.dev', '*.repl.co'],
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
