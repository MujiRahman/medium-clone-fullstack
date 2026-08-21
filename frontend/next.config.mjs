/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'medium-storage.muji-rahman.site',
        pathname: '/medium-uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/medium-uploads/**',
      },
    ],
  },
};

export default nextConfig;
