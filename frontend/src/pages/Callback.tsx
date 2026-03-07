import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { CLIENT_ID, REDIRECT_URI } from '../auth/constants';
import './styles/Callback.css';

export default function Callback() {
  const { setTokens } = useAuth();
  const navigate = useNavigate();
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
    console.log('[OAuth Callback] URL code:', code ? 'present' : 'MISSING');
    console.log('[OAuth Callback] URL state:', state);
    console.log('[OAuth Callback] Saved state:', savedState);
    console.log('[OAuth Callback] Verifier:', verifier ? 'present' : 'MISSING');

    if (!code) {
      const err = `Authorization code not found. URL: ${window.location.href}`;
      console.error('[OAuth Callback]', err);
      setError(err);
      return;
    }

    if (!savedState) {
      const err = `State not found in localStorage. Please try logging in again.`;
      console.error('[OAuth Callback]', err);
      setError(err);
      return;
    }

    if (state !== savedState) {
      const err = `State mismatch. URL state: ${state}, Saved state: ${savedState}`;
      console.error('[OAuth Callback]', err);
      setError(err);
      return;
    }

    if (!verifier) {
      const err = `PKCE Verifier not found in localStorage. Please try logging in again.`;
      console.error('[OAuth Callback]', err);
      setError(err);
      return;
    }

    const exchangeToken = async () => {
      try {
        console.log('[OAuth Callback] Exchanging authorization code for token...');
        // Vite 프록시를 통해 CORS 없이 토큰 교환 (/oauth2 → localhost:9000)
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
          const err = await response.text();
          throw new Error(`Token exchange failed (${response.status}): ${err}`);
        }

        const data = await response.json();
        console.log('[OAuth Callback] Token exchange successful. Granted Scopes:', data.scope);
        console.log('[OAuth Callback] Refresh Token present:', !!data.refresh_token);
        setTokens(data.access_token, data.refresh_token);

        // 성공 후 로컬스토리지 정리
        localStorage.removeItem('pkce_verifier');
        localStorage.removeItem('oauth_state');

        // 상태 업데이트 후 리다이렉트 (100ms 지연)
        setTimeout(() => {
          navigate('/');
        }, 100);
      } catch (e: unknown) {
        const errMsg = `Token exchange failed: ${e instanceof Error ? e.message : String(e)}`;
        console.error('[OAuth Callback]', errMsg);
        setError(errMsg);
      }
    };

    exchangeToken();
  }, [navigate, setTokens]);

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
