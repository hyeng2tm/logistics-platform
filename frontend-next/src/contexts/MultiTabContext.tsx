'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useModal } from './ModalContext';
import { useAuth } from '../auth/AuthContext';

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
  menuKey: string;
  translations: Record<string, string>;
  path: string | null;
  icon: string | null;
   sortOrder: number;
  isVisible: 'Y' | 'N';
  isPc: 'Y' | 'N';
  isMobile: 'Y' | 'N';
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
  favoriteMenuIds: number[];
  toggleFavorite: (menuId: number) => Promise<void>;
  updateFavorites: (menuIds: number[]) => Promise<void>;
}

const MultiTabContext = createContext<MultiTabContextType | undefined>(undefined);

const ALWAYS_ALLOWED_PATHS = ['/', '/dashboard'];

export const MultiTabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<TabType[]>([
    { id: '/', path: '/', title: '대시보드', titleKey: 'common.dashboard', isCloseable: false },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('/');
  const [apiMenus, setApiMenus] = useState<ApiMenu[]>([]);
  const [favoriteMenuIds, setFavoriteMenuIds] = useState<number[]>([]);
  
  const { showAlert } = useModal();
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchMenusAndFavorites = async () => {
      if (!isAuthenticated) return;
      try {
        const { apiClient } = await import('../utils/apiClient');
        const [menusData, favoritesData] = await Promise.all([
          apiClient.get<ApiMenu[]>('/api/v1/system/menus'),
          apiClient.get<number[]>('/api/v1/system/favorites')
        ]);
        setApiMenus(menusData);
        setFavoriteMenuIds(favoritesData);
      } catch (error) {
        console.warn('[MultiTabContext] Failed to fetch data:', error);
      }
    };

    fetchMenusAndFavorites();
  }, [isAuthenticated]);

  const lastProcessedPath = React.useRef<string | null>(null);

  useEffect(() => {
    // Skip always allowed paths
    if (ALWAYS_ALLOWED_PATHS.includes(pathname)) {
      lastProcessedPath.current = pathname;
      return;
    }

    const existingTab = tabs.find(t => t.path === pathname);
    if (existingTab) {
      if (activeTabId !== existingTab.id) {
        setActiveTabId(existingTab.id);
      }
      lastProcessedPath.current = pathname;
    } else if (apiMenus.length > 0 && pathname !== lastProcessedPath.current) {
      // Auto-open tab ONLY if we haven't processed this path yet (i.e., fresh navigation)
      const matchingMenu = apiMenus.find(m => m.path === pathname);
      if (matchingMenu) {
        lastProcessedPath.current = pathname;
        
        // Use matching key from translation.json if we know it (fallback to menuKey)
        const titleKey = matchingMenu.menuKey.includes('monitoring') ? 'sidebar.system_monitoring' : matchingMenu.menuKey;
        
        openTab({
          id: String(matchingMenu.id),
          path: matchingMenu.path!,
          title: (matchingMenu.translations && matchingMenu.translations['ko']) || matchingMenu.menuKey,
          titleKey: titleKey,
          translations: matchingMenu.translations,
          isCloseable: true
        });
      }
    }
  }, [pathname, tabs, apiMenus, activeTabId]);

  const MAX_TABS = 8;

  const openTab = (tabConfig: Omit<TabType, 'isCloseable'> & { isCloseable?: boolean }) => {
    const isAllowed = ALWAYS_ALLOWED_PATHS.includes(tabConfig.path) || 
                      apiMenus.some(m => m.path === tabConfig.path);
    
    if (!isAllowed && apiMenus.length > 0) {
      return;
    }

    const isCloseable = tabConfig.isCloseable ?? true;
    const newTab = { ...tabConfig, isCloseable };
    
    let tabExists = false;
    let limitReached = false;

    setTabs(prev => {
      tabExists = prev.some(t => t.id === newTab.id);
      if (tabExists) return prev;
      
      limitReached = prev.length >= MAX_TABS;
      if (limitReached) return prev;
      
      return [...prev, newTab];
    });

    // Handle warning and navigation in a deferred manner to avoid state update conflict
    setTimeout(() => {
        if (!tabExists && limitReached) {
            showAlert({ 
                title: 'common.warning', 
                message: 'common.max_tabs_reached' 
            });
            return;
        }

        setActiveTabId(newTab.id);
        router.push(newTab.path);
    }, 0);
  };

  const closeTab = (id: string) => {
    const idx = tabs.findIndex(t => t.id === id);
    if (idx === -1) return;
    
    const nextTabs = tabs.filter(t => t.id !== id);
    setTabs(nextTabs);
    
    if (id === activeTabId) {
      const nextActiveIdx = idx === nextTabs.length ? idx - 1 : idx;
      const nextActiveTab = nextTabs[nextActiveIdx];
      if (nextActiveTab) {
        setActiveTabId(nextActiveTab.id);
        router.push(nextActiveTab.path);
      }
    }
  };

  const closeAllTabs = () => {
    const dashboardTab = tabs.find(t => t.id === '/');
    setTabs(dashboardTab ? [dashboardTab] : []);
    setActiveTabId('/');
    router.push('/');
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
      router.push(targetTab.path);
    } else {
      setActiveTabId('/');
      router.push('/');
    }
  };

  const setActiveTab = (id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      setActiveTabId(id);
      router.push(tab.path);
    }
  };

  const toggleFavorite = async (menuId: number) => {
    try {
      const { apiClient } = await import('../utils/apiClient');
      await apiClient.post(`/api/v1/system/favorites/${menuId}/toggle`, {});
      setFavoriteMenuIds(prev => 
        prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
      );
    } catch (error) {
      console.error('[MultiTabContext] Failed to toggle favorite:', error);
    }
  };

  const updateFavorites = async (menuIds: number[]) => {
    try {
      const { apiClient } = await import('../utils/apiClient');
      // For now, let's assume a bulk update endpoint, or we do individual calls
      // Since we don't have a bulk endpoint yet, we'll need to add it or fake it
      // Actually, I should probably add a bulk endpoint to the backend too
      await apiClient.post('/api/v1/system/favorites/bulk', { menuIds });
      setFavoriteMenuIds(menuIds);
    } catch (error) {
      console.error('[MultiTabContext] Failed to update favorites:', error);
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
      apiMenus,
      favoriteMenuIds,
      toggleFavorite,
      updateFavorites
    }}>
      {children}
    </MultiTabContext.Provider>
  );
};

export const useMultiTab = () => {
  const context = useContext(MultiTabContext);
  if (context === undefined) {
    throw new Error('useMultiTab must be used within a MultiTabProvider');
  }
  return context;
};
