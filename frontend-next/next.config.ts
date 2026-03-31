import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // In Docker, we use service names. Outside, we use localhost.
    // We prioritize environment variables, but fallback to service names for reliability.
    const backendUrl = process.env.BACKEND_URL || 'http://sys-backend:8080';
    const authServerUrl = process.env.AUTH_SERVER_URL || 'http://auth-server:9000';
    
    console.log('[NextConfig] Backend URL:', backendUrl);
    console.log('[NextConfig] Auth Server URL:', authServerUrl);

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
