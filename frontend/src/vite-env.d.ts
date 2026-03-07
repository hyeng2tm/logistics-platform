/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_SERVER: string;
  readonly VITE_CLIENT_ID: string;
  readonly VITE_REDIRECT_URI: string;
  readonly VITE_POST_LOGOUT_REDIRECT_URI: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SCOPES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
