import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layout, Layers, Smartphone, Globe, Zap } from 'lucide-react';
import './DevelopmentGuide.css';

const FrontendGuide: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="guide-container">
      <header className="guide-header">
        <div className="header-icon-wrapper">
          <Smartphone className="header-icon" />
        </div>
        <div className="header-text">
          <h1>{t('development.frontend.title', 'Frontend App Development Guide')}</h1>
          <p className="text-muted">{t('development.frontend.desc', 'Standard guide for logistics platform frontend development.')}</p>
        </div>
      </header>

      <div className="guide-content">
        <section className="guide-section">
          <h2><Layers size={20} className="me-2" /> {t('development.frontend.tech_stack', 'Core Technology Stack')}</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <strong>React 18</strong>
              <span>UI Framework with Functional Components & Hooks</span>
            </div>
            <div className="tech-item">
              <strong>TypeScript</strong>
              <span>Static typing for robust code</span>
            </div>
            <div className="tech-item">
              <strong>Vite</strong>
              <span>Build tool and development server</span>
            </div>
            <div className="tech-item">
              <strong>Lucide React</strong>
              <span>Icon library</span>
            </div>
          </div>
        </section>

        <section className="guide-section">
          <h2><Layout size={20} className="me-2" /> {t('development.frontend.structure', 'Project Structure')}</h2>
          <pre className="code-block">
{`src/
  components/     # Reusable UI components
    common/       # Generic components (Buttons, Inputs, etc.)
    layout/       # App layout (Sidebar, Header, MultiTab)
  pages/          # Page-level components organized by module
  contexts/       # React Contexts (Auth, Modal, Message)
  hooks/          # Custom React Hooks
  utils/          # Utility functions (API client, Formatters)
  assets/         # Static assets (Images, Global CSS)`}
          </pre>
        </section>

        <section className="guide-section">
          <h2><Zap size={20} className="me-2" /> {t('development.frontend.conventions', 'Development Conventions')}</h2>
          <ul className="convention-list">
            <li><strong>Component Naming:</strong> Use PascalCase for components (e.g., <code>UserList.tsx</code>).</li>
            <li><strong>Styling:</strong> Prefer CSS Modules or global CSS in <code>src/assets</code>. Avoid inline styles.</li>
            <li><strong>I18n:</strong> Use <code>useTranslation</code> hook. Never hardcode strings.</li>
            <li><strong>Data Fetching:</strong> Use the central <code>apiClient</code> with async/await.</li>
          </ul>
        </section>

        <section className="guide-section">
          <h2><Globe size={20} className="me-2" /> {t('development.frontend.ui_standard', 'UI Standard')}</h2>
          <p>Follow the established grid system (<code>grid-4</code> or <code>grid-5</code>) for filter areas and use the standard <code>MultiTab</code> interface for navigation.</p>
        </section>
      </div>
    </div>
  );
};

export default FrontendGuide;
