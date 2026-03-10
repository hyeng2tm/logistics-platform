import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
      {
        source: '/oauth2/:path*',
        destination: 'http://localhost:9000/oauth2/:path*',
      },
      {
        source: '/login/:path*',
        destination: 'http://localhost:9000/login/:path*',
      },
      {
        source: '/logout',
        destination: 'http://localhost:9000/logout',
      },
      {
        source: '/css/:path*',
        destination: 'http://localhost:9000/css/:path*',
      },
    ];
  },
};

export default nextConfig;
