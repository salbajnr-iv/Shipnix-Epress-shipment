/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['qrcode'],
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

export default nextConfig;
