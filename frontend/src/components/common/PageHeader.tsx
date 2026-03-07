import React from 'react';
import { ChevronRight } from 'lucide-react';
import './SharedComponents.css';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: string[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, breadcrumbs, actions }) => {
  return (
    <div className="page-header-container fade-in">
      <div className="page-header-left">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <span className={`crumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}>
                  {crumb}
                </span>
                {index < breadcrumbs.length - 1 && <ChevronRight size={14} className="crumb-separator" />}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-desc">{description}</p>}
      </div>
      <div className="page-header-actions">
        {actions}
      </div>
    </div>
  );
};
