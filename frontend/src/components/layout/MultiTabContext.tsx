import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useModal } from '../../contexts/ModalContext';

export interface TabType {
  id: string; // usually the path
  path: string;
  title: string;
  titleKey?: string;
  translations?: Record<string, string>;
  isCloseable: boolean;
}

export interface ApiMenu {
  id: number;
  parentId: number | null;
  title: string;
  translations: Record<string, string>;
  path: string | null;
  icon: string | null;
  sortOrder: number;
  isVisible: 'Y' | 'N';
}

interface MultiTabContextType {
  tabs: TabType[];
  activeTabId: string;
  openTab: (tab: Omit<TabType, 'isCloseable'> & { isCloseable?: boolean }) => void;
  closeTab: (id: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (id: string) => void;
  setActiveTabId: (id: string) => void;
  apiMenus: ApiMenu[];
}

const MultiTabContext = createContext<MultiTabContextType | undefined>(undefined);

const ALWAYS_ALLOWED_PATHS = ['/', '/dashboard'];

export const MultiTabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<TabType[]>([
    { id: '/', path: '/', title: '대시보드', titleKey: 'common.dashboard', isCloseable: false },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('/');
  const [apiMenus, setApiMenus] = useState<ApiMenu[]>([]);
  
  
  const { showAlert } = useModal();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        console.log('[MultiTabContext] Fetching system menus...');
        const { apiClient } = await import('../../utils/apiClient');
        const data = await apiClient.get<ApiMenu[]>('/api/v1/system/menus');
        console.log(`[MultiTabContext] Successfully fetched ${data.length} menus.`);
        setApiMenus(data);
      } catch (error) {
        console.error('[MultiTabContext] Failed to fetch menus:', error);
      }
    };

    fetchMenus();
  }, []);

  // Handle active tab switching when URL changes from outside (e.g. back button)
  useEffect(() => {
    const currentPath = location.pathname;
    const existingTab = tabs.find(t => t.path === currentPath);
    if (existingTab) {
      setActiveTabId(existingTab.id);
    }
  }, [location.pathname, tabs]);

  const MAX_TABS = 8;

  const openTab = (tabConfig: Omit<TabType, 'isCloseable'> & { isCloseable?: boolean }) => {
    // Validate path against allowed menus or specific static paths
    const isAllowed = ALWAYS_ALLOWED_PATHS.includes(tabConfig.path) || 
                      apiMenus.some(m => m.path === tabConfig.path);
    
    if (!isAllowed && apiMenus.length > 0) {
      console.warn(`Unauthorized or non-existent menu path blocked: ${tabConfig.path}`);
      return;
    }

    const isCloseable = tabConfig.isCloseable ?? true;
    const newTab = { ...tabConfig, isCloseable };
    
    setTabs(prev => {
      const exists = prev.find(t => t.id === newTab.id);
      if (exists) {
        return prev;
      }
      
      if (prev.length >= MAX_TABS) {
        showAlert({ 
          title: 'common.warning', 
          message: 'msg.max_tabs_reached' 
        });
        return prev;
      }
      
      return [...prev, newTab];
    });
    
    // Only navigate and set active if it exists or was added
    setTabs(currentTabs => {
      const isAlreadyOpen = currentTabs.find(t => t.id === newTab.id);
      if (isAlreadyOpen) {
        setActiveTabId(newTab.id);
        navigate(newTab.path);
      }
      return currentTabs;
    });
  };

  const closeTab = (id: string) => {
    const idx = tabs.findIndex(t => t.id === id);
    if (idx === -1) return;
    
    const nextTabs = tabs.filter(t => t.id !== id);
    setTabs(nextTabs);
    
    // If we are closing the active tab, we need to activate another one
    if (id === activeTabId) {
      // Try to activate the tab to the right, else to the left
      const nextActiveIdx = idx === nextTabs.length ? idx - 1 : idx;
      const nextActiveTab = nextTabs[nextActiveIdx];
      if (nextActiveTab) {
        setActiveTabId(nextActiveTab.id);
        navigate(nextActiveTab.path);
      }
    }
  };

  const closeAllTabs = () => {
    const dashboardTab = tabs.find(t => t.id === '/');
    const newTabs = dashboardTab ? [dashboardTab] : [];
    setTabs(newTabs);
    setActiveTabId('/');
    navigate('/');
  };

  const closeOtherTabs = (id: string) => {
    const dashboardTab = tabs.find(t => t.id === '/');
    const targetTab = tabs.find(t => t.id === id);
    
    const newTabs = [];
    if (dashboardTab) newTabs.push(dashboardTab);
    if (targetTab && targetTab.id !== '/') newTabs.push(targetTab);
    
    setTabs(newTabs);
    if (targetTab) {
      setActiveTabId(targetTab.id);
      navigate(targetTab.path);
    } else {
      setActiveTabId('/');
      navigate('/');
    }
  };

  const setActiveTab = (id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      setActiveTabId(id);
      navigate(tab.path);
    }
  };

  return (
    <MultiTabContext.Provider value={{ 
      tabs, 
      activeTabId, 
      openTab, 
      closeTab, 
      closeAllTabs,
      closeOtherTabs,
      setActiveTabId: setActiveTab, 
      apiMenus 
    }}>
      {children}
    </MultiTabContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMultiTab = () => {
  const context = useContext(MultiTabContext);
  if (context === undefined) {
    throw new Error('useMultiTab must be used within a MultiTabProvider');
  }
  return context;
};
