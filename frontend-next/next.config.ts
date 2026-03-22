import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://sys-backend:8080/api/:path*',
      },
      {
        source: '/oauth2/:path*',
        destination: 'http://auth-server:9000/oauth2/:path*',
      },
      {
        source: '/userinfo',
        destination: 'http://auth-server:9000/userinfo',
      },
    ];
  },
};

export default nextConfig;
