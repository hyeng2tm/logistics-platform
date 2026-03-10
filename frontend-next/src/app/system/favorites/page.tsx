'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Star, Save, RotateCcw } from 'lucide-react';
import { useMultiTab } from '@/contexts/MultiTabContext';
import { Shuttle, ShuttleItem } from '@/components/common/Shuttle';
import './Favorites.css';

export default function ManageFavoritesPage() {
  const { t, i18n } = useTranslation();
  const { apiMenus, favoriteMenuIds, updateFavorites } = useMultiTab();

  const lang = i18n.resolvedLanguage || i18n.language || 'ko';
  const baseLang = lang.split('-')[0];

  const [currentSelected, setCurrentSelected] = useState<ShuttleItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize selected items from context once source data is available
  useEffect(() => {
    if (!isInitialized && apiMenus.length > 0) {
      const favorited = apiMenus
        .filter(m => favoriteMenuIds.includes(m.id))
        .map(m => ({
          id: m.id,
          label: (m.translations && m.translations[baseLang]) || m.menuKey,
          originalItem: m
        }));
      
      // Delay state update to avoid cascading render warning
      setTimeout(() => {
        setCurrentSelected(favorited);
        setIsInitialized(true);
      }, 0);
    }
  }, [favoriteMenuIds, apiMenus, baseLang, isInitialized]);

  const availableItems: ShuttleItem[] = apiMenus
    .filter(m => m.path) // Only menus with paths are candidates for favorites
    .map(m => ({
      id: m.id,
      label: (m.translations && m.translations[baseLang]) || m.menuKey,
      originalItem: m
    }));

  const handleSave = async () => {
    const menuIds = currentSelected.map(item => Number(item.id));
    await updateFavorites(menuIds);
    alert(t('msg.save_success', '성공적으로 저장되었습니다.'));
  };

  const handleReset = () => {
    const favorited = apiMenus
      .filter(m => favoriteMenuIds.includes(m.id))
      .map(m => ({
        id: m.id,
        label: (m.translations && m.translations[baseLang]) || m.menuKey,
        originalItem: m
      }));
    setCurrentSelected(favorited);
  };

  return (
    <div className="favorites-page-container">
      <PageHeader 
        title={t('sidebar.manage_favorites', '나의 즐겨 찾기 관리')} 
        breadcrumbs={[t('common.settings', '설정'), t('sidebar.manage_favorites', '나의 즐겨 찾기 관리')]}
        actions={
          <div className="page-header-actions">
            <button className="btn btn-outline flex items-center gap-2" onClick={handleReset}>
              <RotateCcw size={18} />
              {t('common.reset', '초기화')}
            </button>
            <button className="btn btn-primary flex items-center gap-2" onClick={handleSave}>
              <Save size={18} />
              {t('common.save', '저장')}
            </button>
          </div>
        }
      />

      <Card 
        title={
          <div className="card-title-with-icon">
            <Star size={18} />
            <span>{t('sidebar.favorites_list', '즐겨찾기 관리 (셔틀)')}</span>
          </div>
        }
      >
        <div className="favorites-shuttle-wrapper">
          <Shuttle 
            leftTitle={t('sidebar.available_menus', '사용 가능한 메뉴')}
            rightTitle={t('sidebar.favorite_menus', '나의 즐겨찾기')}
            availableItems={availableItems}
            selectedItems={currentSelected}
            onChange={setCurrentSelected}
          />
          <p className="favorites-hint">
            {t('msg.favorites_shuttle_hint', '왼쪽 목록에서 메뉴를 선택하여 오른쪽으로 이동시키면 즐겨찾기에 추가됩니다. 저장 버튼을 눌러야 반영됩니다.')}
          </p>
        </div>
      </Card>
    </div>
  );
}
