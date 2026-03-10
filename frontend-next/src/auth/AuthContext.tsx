'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { CLIENT_ID, REDIRECT_URI, SCOPES } from './constants';
import i18n from '../i18n';
import { apiClient } from '../utils/apiClient';

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

function generateCodeVerifier(): string {
  if (typeof window === 'undefined') return '';
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

export function AuthProvider({ children }: { children: ReactNode }): React.ReactNode {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccessToken(token);
    }
  }, []);

  const isAuthenticated = !!accessToken;

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('access_token');
      setAccessToken(token);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (accessToken && !user) {
        try {
          const userData = await apiClient.get<User>('/api/v1/users/me');
          setUser(userData);
          
          if (userData.language) {
            i18n.changeLanguage(userData.language);
          }
        } catch (error) {
          console.warn('[AuthContext] Failed to fetch user profile:', error);
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

    if (localStorage.getItem('force_login') === 'true') {
      params.prompt = 'login';
      localStorage.removeItem('force_login');
    }

    const searchParams = new URLSearchParams(params);
    const url = `/oauth2/authorize?${searchParams}`;
    window.location.href = url;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('oauth_state');
    localStorage.removeItem('pkce_verifier');
    localStorage.setItem('force_login', 'true');
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

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
