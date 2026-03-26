import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const authServerUrl = process.env.AUTH_SERVER_URL || 'http://localhost:9000';
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/oauth2/:path*',
        destination: `${authServerUrl}/oauth2/:path*`,
      },
      {
        source: '/userinfo',
        destination: `${authServerUrl}/userinfo`,
      },
    ];
  },
};

export default nextConfig;
