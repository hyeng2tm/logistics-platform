import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';

interface User {
  id: string;
  username: string;
  name: string;
  department: string;
  roleId: string;
  language: string;
}

interface AuthContextType {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

import { CLIENT_ID, REDIRECT_URI, SCOPES } from './constants';
import i18n from '../i18n';
import { apiClient } from '../utils/apiClient';

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem('access_token')
  );
  const [user, setUser] = useState<User | null>(null);

  const isAuthenticated = !!accessToken;

  // localStorage 변화 감시 (다른 탭에서 토큰이 변경될 때)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('access_token');
      setAccessToken(token);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch user profile on login or mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (accessToken && !user) {
        try {
          console.log('[AuthContext] Fetching user profile...');
          const userData = await apiClient.get<User>('/api/v1/users/me');
          setUser(userData);
          
          if (userData.language) {
            console.log('[AuthContext] Applying user language preference:', userData.language);
            i18n.changeLanguage(userData.language);
          }
        } catch (error) {
          console.error('[AuthContext] Failed to fetch user profile:', error);
          // If profile fetch fails (e.g. token invalid), we might want to logout
        }
      } else if (!accessToken) {
        setUser(null);
      }
    };

    fetchProfile();
  }, [accessToken, user]);

  const login = useCallback(async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = crypto.randomUUID();

    localStorage.setItem('pkce_verifier', verifier);
    localStorage.setItem('oauth_state', state);

    const params: Record<string, string> = {
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    };

    // 로그아웃 직후라면 강제 로그인 화면 표시 (세션 무시)
    if (localStorage.getItem('force_login') === 'true') {
      params.prompt = 'login';
      localStorage.removeItem('force_login');
    }

    const searchParams = new URLSearchParams(params);
    // authorize는 Vite 프록시 경유 → autoRewrite로 Location 헤더가 localhost:3000으로 재작성됨
    const url = `/oauth2/authorize?${searchParams}`;
    console.log('[AuthContext] Redirecting to:', url);
    window.location.href = url;
  }, []);

  const logout = useCallback(() => {
    console.log('[AuthContext] Starting logout process');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('oauth_state');
    localStorage.removeItem('pkce_verifier');
    // 다음 로그인 시 세션을 무시하고 로그인 화면을 강제하기 위한 플래그
    localStorage.setItem('force_login', 'true');
    
    // 서버 세션을 종료하기 위해 백엔드 로그아웃 엔드포인트로 리다이렉트
    window.location.href = '/logout';
  }, []);

  const setTokens = useCallback((token: string, refreshToken?: string) => {
    localStorage.setItem('access_token', token);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    setAccessToken(token);
  }, []);

  const value = useMemo(() => ({
    accessToken, user, isAuthenticated, login, logout, setTokens
  }), [accessToken, user, isAuthenticated, login, logout, setTokens]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
