import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // In Docker, we use service names. Outside, we use localhost.
    const isDev = process.env.NODE_ENV === 'development';
    const defaultBackend = isDev ? 'http://localhost:8080' : 'http://sys-backend:8080';
    const defaultAuth = isDev ? 'http://localhost:9000' : 'http://auth-server:9000';

    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || defaultBackend;
    const authServerUrl = process.env.AUTH_SERVER_URL || process.env.NEXT_PUBLIC_AUTH_SERVER || defaultAuth;
    
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
