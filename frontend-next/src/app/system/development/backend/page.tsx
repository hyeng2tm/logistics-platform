'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Database, Server, ShieldCheck, Cpu, Terminal, Layers } from 'lucide-react';
import '../DevelopmentGuide.css';

const BackendGuide: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="guide-container p-24">
      <header className="guide-header">
        <div className="header-icon-wrapper">
          <Server className="header-icon" />
        </div>
        <div className="header-text">
          <h1>{t('development.backend.title', 'Backend Development Guide')}</h1>
          <p className="text-muted mt-2">{t('development.backend.desc', 'Standard guide for logistics platform backend development.')}</p>
        </div>
      </header>

      <div className="guide-content mt-8">
        <section className="guide-section mb-6">
          <h2>
            <Cpu size={22} className="me-2" /> {t('development.backend.tech_stack', 'Backend Tech Stack')}
          </h2>
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
            <div className="tech-item">
              <strong>H2 / PostgreSQL</strong>
              <span>Relational Database Management</span>
            </div>
            <div className="tech-item">
              <strong>MapStruct</strong>
              <span>Entity to DTO Mapping</span>
            </div>
          </div>
        </section>

        <section className="guide-section mb-6">
          <h2>
            <Layers size={22} className="me-2" /> Architecture & Structure
          </h2>
          <pre className="code-block">
{`src/main/java/com/logistics/platform/
  config/         # Configuration (Security, Jackson, Init)
  controller/     # REST APIs & Route Definitions
  domain/         # JPA Entities
  dto/            # Request & Response Data Transfer Objects
  repository/     # Spring Data JPA interfaces
  service/        # Business Logic & Transactions`}
          </pre>
        </section>

        <section className="guide-section mb-6">
          <h2>
            <Database size={22} className="me-2" /> {t('development.backend.db_standard', 'Database Standards')}
          </h2>
          <ul className="convention-list">
            <li><strong>Naming Conventions:</strong> Use <code>t_sys_</code> prefix for system/admin tables and <code>t_dom_</code> for core domain business tables.</li>
            <li><strong>Case Sensitivity:</strong> Use <code>snake_case</code> for table and column names universally in the DB.</li>
            <li><strong>Audit Logs:</strong> Include <code>created_at</code> and <code>updated_at</code> in all major tables, handled via mapped superclasses.</li>
            <li><strong>Foreign Keys:</strong> Explicitly define constraints in JPA Entities using <code>@JoinColumn</code>.</li>
          </ul>
        </section>

        <section className="guide-section mb-6">
          <h2>
            <Terminal size={22} className="me-2" /> {t('development.backend.api_standard', 'API Design')}
          </h2>
          <ul className="convention-list">
            <li><strong>RESTful Principles:</strong> Use proper HTTP methods (<code>GET</code>, <code>POST</code>, <code>PUT</code>, <code>DELETE</code>) for CRUD operations.</li>
            <li><strong>API Versioning:</strong> All endpoints should be prefixed with <code>/api/v1/</code> to ensure backward compatibility in the future.</li>
            <li><strong>Response Structures:</strong> Return standardized payloads. Do not leak entity structures directly; convert to DTOs in the service layer.</li>
          </ul>
        </section>

        <section className="guide-section mb-6">
          <h2>
            <ShieldCheck size={22} className="me-2" /> {t('development.backend.security', 'Security Practices')}
          </h2>
          <p className="mb-4">
            Security is paramount in the logistics platform. Follow these strict guidelines when developing new endpoints.
          </p>
          <ul className="convention-list">
            <li><strong>Authorization:</strong> Always validate JWT tokens and meticulously check user roles at the controller level using <code>@PreAuthorize(&quot;hasRole(&apos;ROLE_ADMIN&apos;)&quot;)</code> or similar.</li>
            <li><strong>Password Storage:</strong> Never log passwords or sensitive API keys. Use <code>PasswordEncoder</code> for hashing when modifying user credentials.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default BackendGuide;
