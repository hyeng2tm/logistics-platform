'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './SharedComponents.css';

interface CardProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
  headerActions?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  className = '', 
  bodyClassName = '', 
  noPadding = false, 
  headerActions,
  collapsible = false,
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className={`common-card ${className} ${collapsible ? 'is-collapsible' : ''} ${isCollapsed ? 'is-collapsed' : ''}`}>
      {(title || headerActions || collapsible) && (
        <div className={`common-card-header ${collapsible ? 'clickable' : ''}`} onClick={collapsible ? toggleCollapse : undefined}>
          <div className="common-card-header-left">
            {title && (typeof title === 'string' ? <h3 className="common-card-title">{title}</h3> : title)}
          </div>
          <div className="common-card-header-right">
            {headerActions && <div className="common-card-actions">{headerActions}</div>}
            {collapsible && (
              <button 
                className="card-collapse-toggle" 
                aria-label={isCollapsed ? "Expand" : "Collapse"}
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </button>
            )}
          </div>
        </div>
      )}
      <div className={`common-card-collapse-wrapper ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className={`common-card-body ${noPadding ? 'no-padding' : ''} ${bodyClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
};
