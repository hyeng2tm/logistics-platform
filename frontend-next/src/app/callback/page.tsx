'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth/AuthContext';
import { CLIENT_ID, REDIRECT_URI } from '../../auth/constants';
import './Callback.css';

export default function Callback() {
  const { setTokens } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const savedState = localStorage.getItem('oauth_state');
    const verifier = localStorage.getItem('pkce_verifier');

    console.log('[OAuth Callback] Starting callback handler');
    if (!code) {
      const err = `Authorization code not found. URL: ${window.location.href}`;
      setError(err);
      return;
    }

    if (!savedState || state !== savedState) {
      setError(`State mismatch or not found.`);
      return;
    }

    if (!verifier) {
      setError(`PKCE Verifier not found in localStorage.`);
      return;
    }

    const exchangeToken = async () => {
      try {
        const response = await fetch('/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            code: code!,
            code_verifier: verifier!,
          }),
        });

        if (!response.ok) {
          throw new Error(`Token exchange failed (${response.status})`);
        }

        const data = await response.json();
        setTokens(data.access_token, data.refresh_token);

        localStorage.removeItem('pkce_verifier');
        localStorage.removeItem('oauth_state');

        setTimeout(() => {
          router.push('/');
        }, 100);
      } catch (e: unknown) {
        setError(`Token exchange failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    };

    exchangeToken();
  }, [router, setTokens]);

  if (error) {
    return (
      <div className="callback-error-container">
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.href = window.location.origin} className="callback-back-button">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="callback-container">
      <p>로그인 처리 중...</p>
    </div>
  );
}
