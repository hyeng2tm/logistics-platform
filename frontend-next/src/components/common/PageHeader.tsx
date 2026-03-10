'use client';

import React from 'react';
import { ChevronRight, Star } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useMultiTab } from '../../contexts/MultiTabContext';
import './SharedComponents.css';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: string[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, breadcrumbs, actions }) => {
  const pathname = usePathname();
  const { apiMenus, favoriteMenuIds, toggleFavorite } = useMultiTab();

  const currentMenu = apiMenus.find(m => m.path === pathname);
  const isFavorited = currentMenu ? favoriteMenuIds.includes(currentMenu.id) : false;

  const handleToggleFavorite = () => {
    if (currentMenu) {
      toggleFavorite(currentMenu.id);
    }
  };

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
        <div className="page-title-wrapper">
          <h1 className="page-title">{title}</h1>
          {currentMenu && (
            <button 
              className={`btn-favorite ${isFavorited ? 'active' : ''}`}
              onClick={handleToggleFavorite}
              title={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              <Star size={24} fill={isFavorited ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
        {description && <p className="page-desc">{description}</p>}
      </div>
      <div className="page-header-actions">
        {actions}
      </div>
    </div>
  );
};
