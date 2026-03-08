import React, { useState } from 'react';
import { X } from 'lucide-react';
import classNames from 'classnames';
import Sidebar from './Sidebar';
import Header from './Header';
import { useMultiTab, TabType } from './MultiTabContext';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';
import { useTranslation } from 'react-i18next';
import './Layout.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { tabs, activeTabId, setActiveTabId, closeTab, closeAllTabs } = useMultiTab();
  const { isMobile } = useDeviceDetect();
  const { t, i18n } = useTranslation();

  const lang = i18n.resolvedLanguage || i18n.language || 'ko';
  const baseLang = lang.split('-')[0];

  const getTabDisplayTitle = (tab: TabType) => {
    return (tab.translations && tab.translations[baseLang]) || t(tab.titleKey || tab.title);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="layout-wrapper">
      <Sidebar isOpen={isSidebarOpen || !isMobile} onClose={closeSidebar} />
      
      <div className="layout-content">
        <Header onMenuToggle={toggleSidebar} />
        
        {/* Multi-tab Bar for PC */}
        {!isMobile && (
          <div className="multi-tab-bar">
            {tabs.map(tab => (
              <div 
                key={tab.id}
                className={classNames('tab-item', { active: tab.id === activeTabId })}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span className="tab-title" title={getTabDisplayTitle(tab)}>{getTabDisplayTitle(tab)}</span>
                {tab.isCloseable && (
                  <button 
                    className="tab-close-btn"
                    title="탭 닫기"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            {tabs.length > 1 && (
              <div className="tab-actions-wrapper">
                <button 
                  className="tab-action-btn close-all" 
                  title={t('common.close_all', '전체 닫기')}
                  onClick={closeAllTabs}
                  aria-label={t('common.close_all', '전체 닫기')}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        <main className="page-content-wrapper">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
