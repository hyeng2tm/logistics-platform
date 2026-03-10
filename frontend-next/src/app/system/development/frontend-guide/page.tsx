'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layout, Layers, Smartphone, Globe, Zap } from 'lucide-react';
import '../DevelopmentGuide.css';

const FrontendGuide: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="guide-container p-24">
      <header className="guide-header">
        <div className="header-icon-wrapper">
          <Smartphone className="header-icon" />
        </div>
        <div className="header-text">
          <h1>{t('development.frontend.title', 'Frontend App Development Guide')}</h1>
          <p className="text-muted mt-2">{t('development.frontend.desc', 'Standard guide for logistics platform frontend development.')}</p>
        </div>
      </header>

      <div className="guide-content mt-8">
        <section className="guide-section card mb-6">
          <h2>
            <Layers size={20} className="me-2" /> {t('development.frontend.tech_stack', 'Core Technology Stack')}
          </h2>
          <div className="tech-grid">
            <div className="tech-item">
              <strong>Next.js 15 (App Router)</strong>
              <span>React Framework for SSR & Optimized Routing</span>
            </div>
            <div className="tech-item">
              <strong>TypeScript</strong>
              <span>Static typing for robust code</span>
            </div>
            <div className="tech-item">
              <strong>Vanilla CSS</strong>
              <span>Custom styling without Tailwind</span>
            </div>
            <div className="tech-item">
              <strong>Lucide React</strong>
              <span>Icon library</span>
            </div>
          </div>
        </section>

        <section className="guide-section card mb-6">
          <h2>
            <Layout size={20} className="me-2" /> {t('development.frontend.structure', 'Project Structure')}
          </h2>
          <pre className="code-block">
{`src/
  app/            # App Router pages and layouts
  components/     # Reusable UI components
    common/       # Generic components (Buttons, Inputs, etc.)
    layout/       # App layout (Sidebar, Header, MainLayout)
  contexts/       # React Contexts (Auth, Modal, Message, MultiTab)
  hooks/          # Custom React Hooks
  utils/          # Utility functions (API client, Formatters)
  auth/           # OAuth2 configuration & constants`}
          </pre>
        </section>

        <section className="guide-section card mb-6">
          <h2>
            <Zap size={20} className="me-2" /> {t('development.frontend.conventions', 'Development Conventions')}
          </h2>
          <ul className="convention-list">
            <li><strong>Component Naming:</strong> Use PascalCase for components (e.g., <code>UserList.tsx</code>).</li>
            <li><strong>Server/Client Components:</strong> Use <code>&apos;use client&apos;</code> directive only when hooks or interactivity are needed.</li>
            <li><strong>I18n:</strong> Use <code>useTranslation</code> hook. Never hardcode strings.</li>
            <li><strong>Data Fetching:</strong> Use the central <code>apiClient</code> with async/await.</li>
          </ul>
        </section>

        <section className="guide-section card">
          <h2>
            <Globe size={20} className="me-2" /> {t('development.frontend.ui_standard', 'UI Standard')}
          </h2>
          <p>Follow the established grid system (<code>grid-4</code> or <code>grid-5</code>) for filter areas and use the standard Next.js routing patterns (currently wrapped inside <code>MultiTab</code> context).</p>
        </section>
      </div>
    </div>
  );
};

export default FrontendGuide;
