import React from 'react';
import './SharedComponents.css';

interface CardProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
  headerActions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', bodyClassName = '', noPadding = false, headerActions }) => {
  return (
    <div className={`common-card ${className}`}>
      {(title || headerActions) && (
        <div className="common-card-header">
          {title && (typeof title === 'string' ? <h3 className="common-card-title">{title}</h3> : title)}
          {headerActions && <div className="common-card-actions">{headerActions}</div>}
        </div>
      )}
      <div className={`common-card-body ${noPadding ? 'no-padding' : ''} ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};
