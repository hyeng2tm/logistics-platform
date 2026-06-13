import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // In Docker, we use service names. Outside, we use localhost.
    const isDev = process.env.NODE_ENV === 'development';
    const defaultBackend = isDev ? 'http://localhost:8080' : 'http://sys-backend:8080';
    const defaultAuth = isDev ? 'http://localhost:9000' : 'http://auth-server:9000';
    const defaultMdm = isDev ? 'http://localhost:8082' : 'http://mdm-backend:8082';
    const defaultWms = isDev ? 'http://localhost:8083' : 'http://wms-backend:8083';

    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || defaultBackend;
    const authServerUrl = process.env.AUTH_SERVER_URL || process.env.NEXT_PUBLIC_AUTH_SERVER || defaultAuth;
    const mdmBackendUrl = process.env.MDM_BACKEND_URL || process.env.NEXT_PUBLIC_MDM_BACKEND_URL || defaultMdm;
    const wmsBackendUrl = process.env.WMS_BACKEND_URL || process.env.NEXT_PUBLIC_WMS_BACKEND_URL || defaultWms;
    
    console.log('[NextConfig] Backend URL:', backendUrl);
    console.log('[NextConfig] Auth Server URL:', authServerUrl);
    console.log('[NextConfig] MDM Backend URL:', mdmBackendUrl);
    console.log('[NextConfig] WMS Backend URL:', wmsBackendUrl);

    return [
      {
        source: '/api/v1/wms/:path*',
        destination: `${wmsBackendUrl}/api/v1/wms/:path*`,
      },
      {
        source: '/api/v1/mdm/:path*',
        destination: `${mdmBackendUrl}/api/v1/mdm/:path*`,
      },
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
