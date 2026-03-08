import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useMultiTab } from './MultiTabContext';
import { ChevronDown, ChevronRight, Home, Box, Truck, Settings, Star, Layers, LayoutTemplate, ShieldAlert, Users, List, Menu, X } from 'lucide-react';
import classNames from 'classnames';

export type MenuItemType = {
  id: string;
  title: string;
  titleKey?: string;
  translations?: Record<string, string>;
  path?: string;
  icon?: React.ReactNode;
  children?: MenuItemType[];
};

const mapIcon = (iconName: string | null) => {
  switch (iconName) {
    case 'Home': return <Home size={18} />;
    case 'Users': return <Users size={18} />;
    case 'Truck': return <Truck size={18} />;
    case 'Box': return <Box size={18} />;
    case 'Settings': return <Settings size={18} />;
    case 'ShieldAlert': return <ShieldAlert size={18} />;
    case 'LayoutTemplate': return <LayoutTemplate size={18} />;
    default: return <List size={18} />;
  }
};

const FAVORITE_MENU: MenuItemType[] = [
  { id: 'dashboard', title: 'common.dashboard', path: '/', icon: <Home size={18} /> },
  { id: 'shipments-status', title: 'sidebar.shipment_management', path: '/shipments/status', icon: <Star size={18} /> },
  { id: 'inbound', title: 'sidebar.inbound_management', path: '/inventory/warehouse/inbound', icon: <Star size={18} /> }
];

interface SidebarProps {
  isOpen: boolean;
  isCollapsed?: boolean;
  onClose: () => void;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, isCollapsed, onClose, onToggleCollapse }) => {
  const { t, i18n: i18nInstance } = useTranslation();
  const [menuMode, setMenuMode] = useState<'base' | 'favorite'>('base');
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  
  const location = useLocation();
  const { openTab, apiMenus } = useMultiTab();

  const dynamicMenus = React.useMemo(() => {
    if (apiMenus.length === 0) return [];

    const lang = i18nInstance.resolvedLanguage || i18nInstance.language || 'ko';
    const baseLang = lang.split('-')[0];

    const buildTree = (parentId: number | null): MenuItemType[] => {
      return apiMenus
        .filter(m => m.parentId === parentId && m.isVisible === 'Y')
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(m => {
          const children = buildTree(m.id);
          
          const displayTitle = (m.translations && m.translations[baseLang]) || m.title;

          return {
            id: m.id.toString(),
            title: displayTitle,
            titleKey: m.title, // Keep the original key
            translations: m.translations,
            path: m.path || undefined,
            icon: mapIcon(m.icon),
            children: children.length > 0 ? children : undefined
          };

        });
    };

    return buildTree(null);
  }, [apiMenus, i18nInstance.language, i18nInstance.resolvedLanguage]);

  const toggleMenu = (id: string, depth: number) => {
    if (isCollapsed) return; // Don't expand menus when collapsed
    
    setOpenMenus(prev => {
      // If expanding a top-level menu (depth 1), close others
      if (depth === 1 && !prev[id]) {
        return { [id]: true };
      }
      // Otherwise toggle as usual (keeps nested sub-menus functional)
      return { ...prev, [id]: !prev[id] };
    });
  };

  const handleMenuClick = (item: MenuItemType, depth: number) => {
    if (item.children) {
      toggleMenu(item.id, depth);
    } else if (item.path) {
      // item.title is already translated via DB fields or it's an i18n key
      openTab({ 
        id: item.path, 
        path: item.path, 
        title: item.title,
        titleKey: item.titleKey,
        translations: item.translations
      });
      onClose(); // close sidebar on mobile
    }
  };

  const currentMenu = menuMode === 'base' ? dynamicMenus : FAVORITE_MENU;

  const renderMenuItems = (items: MenuItemType[], depth = 1) => {
    return items.map(item => {
      const hasChildren = !!item.children && item.children.length > 0;
      const isOpenMenu = openMenus[item.id];
      const isActive = location.pathname === item.path;

      return (
        <div key={item.id} className={classNames('menu-item-container', `depth-${depth}`)}>
          <div 
            className={classNames('menu-item', { active: isActive && !hasChildren })}
            onClick={() => handleMenuClick(item, depth)}
            title={isCollapsed ? t(item.title) : undefined}
          >
            <div className="menu-item-left">
              {item.icon && <span className="menu-icon">{item.icon}</span>}
              {!isCollapsed && <span className="menu-title">{t(item.title)}</span>}
            </div>
            {hasChildren && !isCollapsed && (
              <div className="menu-chevron">
                {isOpenMenu ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            )}
          </div>
          
          {hasChildren && !isCollapsed && (
            <div className={classNames('menu-children', `depth-${depth}`, { open: isOpenMenu })}>
              {renderMenuItems(item.children!, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      <div className={classNames('sidebar-overlay', { open: isOpen })} onClick={onClose}></div>
      <aside className={classNames('layout-sidebar', { open: isOpen, collapsed: isCollapsed })}>
        <div className="sidebar-logo">
          {!isCollapsed && (
            <div className="logo-content">
              <Layers className="me-2 sidebar-logo-icon" />
              <span className="sidebar-logo-text">Logistics OS</span>
            </div>
          )}
          {onToggleCollapse && (
            <button 
              className="sidebar-inner-toggle"
              onClick={onToggleCollapse}
              title={t('common.toggle_sidebar', '사이드바 토글')}
            >
              <div className={classNames('animated-icon-wrapper', { 'is-collapsed': isCollapsed })}>
                <Menu className="icon-hamburger" size={24} />
                <X className="icon-close" size={24} />
              </div>
            </button>
          )}
        </div>

        <div className="sidebar-toggle-group">
          <button 
            className={classNames('sidebar-toggle-btn', { active: menuMode === 'base' })}
            onClick={() => setMenuMode('base')}
          >
            {t('common.system_menu')}
          </button>
          <button 
            className={classNames('sidebar-toggle-btn', { active: menuMode === 'favorite' })}
            onClick={() => setMenuMode('favorite')}
          >
            <Star size={14} className="favorite-icon" />
            {t('common.favorites')}
          </button>
        </div>

        <div className="sidebar-menu-wrapper">
          {renderMenuItems(currentMenu)}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
