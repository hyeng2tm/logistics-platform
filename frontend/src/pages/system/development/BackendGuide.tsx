import React from 'react';
import { useTranslation } from 'react-i18next';
import { Database, Server, ShieldCheck, Cpu, Terminal } from 'lucide-react';
import './DevelopmentGuide.css';

const BackendGuide: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="guide-container">
      <header className="guide-header">
        <div className="header-icon-wrapper">
          <Server className="header-icon" />
        </div>
        <div className="header-text">
          <h1>{t('development.backend.title', 'Backend Development Guide')}</h1>
          <p className="text-muted">{t('development.backend.desc', 'Standard guide for logistics platform backend development.')}</p>
        </div>
      </header>

      <div className="guide-content">
        <section className="guide-section">
          <h2><Cpu size={20} className="me-2" /> {t('development.backend.tech_stack', 'Backend Tech Stack')}</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <strong>Java 17 / 21</strong>
              <span>Core Language</span>
            </div>
            <div className="tech-item">
              <strong>Spring Boot 3.x</strong>
              <span>Application Framework</span>
            </div>
            <div className="tech-item">
              <strong>Spring Data JPA</strong>
              <span>ORM & Database Access</span>
            </div>
            <div className="tech-item">
              <strong>Spring Security</strong>
              <span>Authentication & Authorization (OAuth2)</span>
            </div>
          </div>
        </section>

        <section className="guide-section">
          <h2><Database size={20} className="me-2" /> {t('development.backend.db_standard', 'Database Standards')}</h2>
          <ul className="convention-list">
            <li><strong>Naming:</strong> Use <code>t_sys_</code> prefix for system tables and <code>t_dom_</code> for domain tables.</li>
            <li><strong>Case:</strong> Use snake_case for table and column names.</li>
            <li><strong>Audit:</strong> Include <code>created_at</code>, <code>updated_at</code> in all major tables.</li>
          </ul>
        </section>

        <section className="guide-section">
          <h2><Terminal size={20} className="me-2" /> {t('development.backend.api_standard', 'API Design')}</h2>
          <ul className="convention-list">
            <li><strong>RESTful:</strong> Use proper HTTP methods (GET, POST, PUT, DELETE).</li>
            <li><strong>Versioning:</strong> All APIs should be prefixed with <code>/api/v1/</code>.</li>
            <li><strong>Response:</strong> Use <code>ResponseEntity</code> and standard DTOs for consistent response structures.</li>
          </ul>
        </section>

        <section className="guide-section">
          <h2><ShieldCheck size={20} className="me-2" /> {t('development.backend.security', 'Security Practices')}</h2>
          <p>Always validate JWT tokens and check user roles at the controller or service level using <code>@PreAuthorize</code>.</p>
        </section>
      </div>
    </div>
  );
};

export default BackendGuide;
