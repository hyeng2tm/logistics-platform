import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';
import { Bell, Search, Menu, UserCircle, LogOut, Languages } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { logout } = useAuth();
  const { isMobile } = useDeviceDetect();
  const { t, i18n } = useTranslation();
  const languages = ['ko', 'en', 'ja', 'zh'];

  const toggleLanguage = () => {
    const currentIndex = languages.indexOf(i18n.language.split('-')[0]);
    const nextIndex = (currentIndex + 1) % languages.length;
    i18n.changeLanguage(languages[nextIndex]);
  };

  return (
    <header className="layout-header">
      <div className="header-left">
        {isMobile && (
          <button className="menu-btn" onClick={onMenuToggle} title={t('common.open_menu')}>
            <Menu size={24} />
          </button>
        )}
        {!isMobile && (
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder={t('common.search')} />
          </div>
        )}
      </div>

      <div className="header-right">
        <button className="icon-btn" onClick={toggleLanguage} title="Change Language">
          <Languages size={20} />
          <span className="lang-code">{(i18n.language || 'ko').split('-')[0].toUpperCase()}</span>
        </button>
        <button className="icon-btn" title={t('common.notifications')}>
          <Bell size={20} />
          <span className="badge">3</span>
        </button>
        <div className="user-profile">
          <UserCircle size={24} className="profile-icon"/>
          {!isMobile && <span className="user-name">{t('common.admin')}</span>}
        </div>
        <button onClick={logout} className="logout-btn">
          <LogOut size={18} />
          {!isMobile && <span>{t('common.logout')}</span>}
        </button>
      </div>
    </header>
  );
};

export default Header;
