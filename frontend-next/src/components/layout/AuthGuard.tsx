'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import './Layout.css';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login } = useAuth();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check localStorage on mount to see if we might be authenticated
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    // Give AuthContext a moment to update state if token exists
    if (token && !isAuthenticated) {
      const timer = setTimeout(() => setIsInitializing(false), 50);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setIsInitializing(false), 0);
    }
  }, [isAuthenticated]);

  const isCallbackPage = pathname?.startsWith('/callback');

  useEffect(() => {
    if (!isInitializing && !isCallbackPage && !isAuthenticated && !isRedirecting) {
      setTimeout(() => setIsRedirecting(true), 0);
      login();
    }
  }, [isAuthenticated, isCallbackPage, login, isRedirecting, isInitializing]);

  if (isCallbackPage) {
    return <>{children}</>;
  }

  if (isInitializing || !isAuthenticated || isRedirecting) {
    return (
      <div className="login-redirect-container">
        <div className="login-redirect-content">
          <h2 className="login-redirect-title">Logistics Platform</h2>
          <h3 className="login-redirect-subtitle">
            {isInitializing 
              ? t('common.session_checking', '사용자 세션을 확인 중입니다...')
              : t('common.redirecting_to_login', '로그인 페이지로 이동 중입니다...')
            }
          </h3>
          <div className="login-redirect-spinner-container">
            <div className="login-redirect-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
