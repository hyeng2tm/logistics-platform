'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Server, Key, Unlock, Smartphone, ArrowRightLeft, FileCode, CheckCircle, FolderTree } from 'lucide-react';
import '../DevelopmentGuide.css';

const AuthServerGuide: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="guide-container p-24">
      <header className="guide-header">
        <div className="header-icon-wrapper">
          <ShieldCheck className="header-icon" />
        </div>
        <div className="header-text">
          <h1>{t('development.auth.title', 'Auth Server Development Guide')}</h1>
          <p className="text-muted mt-2">{t('development.auth.desc', 'Standard guide for logistics platform authentication and authorization.')}</p>
        </div>
      </header>

      <div className="guide-content mt-8">
        <section className="guide-section card mb-6">
          <h2>
            <Server size={22} className="me-2" /> Auth Tech Stack
          </h2>
          <div className="tech-grid">
            <div className="tech-item">
              <strong>Spring Authorization Server</strong>
              <span>OAuth 2.1 Provider</span>
            </div>
            <div className="tech-item">
              <strong>OAuth2 / OIDC</strong>
              <span>Core Protocols</span>
            </div>
            <div className="tech-item">
              <strong>JWT (JSON Web Token)</strong>
              <span>Stateless Authentication</span>
            </div>
            <div className="tech-item">
              <strong>Spring Security</strong>
              <span>Resource Server Protection</span>
            </div>
            <div className="tech-item">
              <strong>Next-Auth / Custom Client</strong>
              <span>Frontend Integration</span>
            </div>
          </div>
        </section>

        <section className="guide-section card mb-6">
          <h2>
            <FolderTree size={22} className="me-2" /> {t('development.auth.structure', 'Auth-Server Source Structure')}
          </h2>
          <p className="mb-4 text-slate-600 text-sm">
            The <code>auth-server</code> is an independent Spring Boot application responsible for issuing and managing OAuth2/JWT tokens.
          </p>
          <pre className="code-block">
{`src/main/java/com/logistics/auth/
  config/         # Authorization Server settings, Security config, RSA Keys
  controller/     # REST endpoints for login, tokens, API definitions
  entity/         # JPA Entities for OAuth2 (Clients, Users, Records)
  repository/     # Spring Data JPA interfaces
  service/        # Business logic (UserDetails / ClientDetails)`}
          </pre>
        </section>

        <section className="guide-section card mb-6">
          <h2>
            <Key size={22} className="me-2" /> {t('development.auth.architecture', 'Authentication Architecture')}
          </h2>
          <p className="mb-4">
            The platform relies on a centralized Authorization Server separating authentication logic from the Resource (Backend) Server.
          </p>

          <h3 className="mt-8 mb-4 text-lg font-bold text-slate-700">OAuth2 Authorization Code Flow</h3>
          <div className="backend-arch-diagram mt-4">
            <div className="arch-client">
              <Smartphone size={18} /> Client (React / Next.js)
            </div>
            
            <div className="auth-flow-row mt-4 mb-4">
               <div className="arch-layer auth-step">
                   1. Request Authorization Code <br/> <code>/oauth2/authorize</code>
               </div>
               <div className="arch-arrow-horizontal"><ArrowRightLeft size={16} /></div>
               <div className="arch-layer security auth-server-box">
                 <ShieldCheck size={24} className="mx-auto mb-2" />
                 <strong>Authorization Server</strong>
                 <div className="text-xs mt-1">(Validates Credentials, issues Code)</div>
               </div>
            </div>

            <div className="auth-flow-row mt-4 mb-4">
               <div className="arch-layer auth-step">
                   2. Exchange Code for Token <br/> <code>/oauth2/token</code>
               </div>
               <div className="arch-arrow-horizontal"><ArrowRightLeft size={16} /></div>
               <div className="arch-layer security auth-server-box">
                  <Key size={24} className="mx-auto mb-2" />
                 <strong>Authorization Server</strong>
                 <div className="text-xs mt-1">(Returns Access & Refresh Tokens)</div>
               </div>
            </div>

             <div className="auth-flow-row mt-4">
               <div className="arch-layer auth-step">
                   3. Access Protected Resource <br/> <code>Bearer [Access Token]</code>
               </div>
               <div className="arch-arrow-horizontal"><ArrowRightLeft size={16} /></div>
               <div className="arch-layer server auth-resource-box">
                  <Server size={24} className="mx-auto mb-2" />
                 <strong>Backend Server (Resource)</strong>
                 <div className="text-xs mt-1">(Validates JWT Signature via JWKS URI)</div>
               </div>
            </div>
            
          </div>
        </section>

        <section className="guide-section card mb-6">
          <h2>
            <FileCode size={22} className="me-2" /> {t('development.auth.config', 'Configuration Details')}
          </h2>

          <div className="grid grid-cols-1 gap-6">
             <div>
              <h3 className="mb-3 text-lg font-bold text-slate-700">Client Settings (Frontend Environment)</h3>
              <p className="mb-2 text-sm text-slate-600">The frontend must be configured with identical client credentials registered in the Auth Server.</p>
              <pre className="code-block">
{`# .env.local (Next.js)
NEXT_PUBLIC_AUTH_URL=http://localhost:9000
AUTH_CLIENT_ID=logistics-client
AUTH_CLIENT_SECRET=secret
AUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
`}
              </pre>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-bold text-slate-700">Resource Server Settings (Backend Environment)</h3>
              <p className="mb-2 text-sm text-slate-600">The backend needs to know where to fetch the public keys (JWKS) to validate incoming JWTs.</p>
              <pre className="code-block">
{`# application.yml (Spring Boot)
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:9000          # Issuer validation
          jwk-set-uri: \${AUTH_SERVER_URL}/oauth2/jwks # Signature validation
`}
              </pre>
            </div>
          </div>
        </section>

         <section className="guide-section card mb-6">
          <h2>
            <Unlock size={22} className="me-2" /> Security Practices
          </h2>
          <ul className="convention-list">
            <li><CheckCircle size={16} className="inline mr-2 text-green-500"/> <strong>Token Storage:</strong> Store the Access Token in Memory or HTTP-Only Cookies. Do not store it in <code>localStorage</code> due to XSS risks.</li>
            <li><CheckCircle size={16} className="inline mr-2 text-green-500"/> <strong>PKCE (Proof Key for Code Exchange):</strong> Highly recommended for public clients (like SPAs) to prevent authorization code interception attacks.</li>
            <li><CheckCircle size={16} className="inline mr-2 text-green-500"/> <strong>Refresh Token Rotation:</strong> Use rotating refresh tokens. Once a refresh token is used, it should be invalidated and a new one issued.</li>
          </ul>
        </section>

      </div>
    </div>
  );
};

export default AuthServerGuide;
