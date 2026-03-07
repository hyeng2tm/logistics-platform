import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Save, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';
import { useModal } from '../../contexts/ModalContext';

import './MenuManagement.css';

interface MenuData {
  id: number;
  parentId: number | null;
  title: string;
  translations: Record<string, string>;
  path: string | null;
  icon: string | null;
  sortOrder: number;
  isVisible: 'Y' | 'N';
}

const supportedLanguages = [
  { code: 'ko', label: '한국어', placeholderKey: 'common.please_wait' },
  { code: 'en', label: 'English', placeholderKey: 'common.please_wait' },
  { code: 'ja', label: '日本語', placeholderKey: 'common.please_wait' },
  { code: 'zh', label: '中文', placeholderKey: 'common.please_wait' }
];
// Note: We can add more specific placeholder keys if needed, but for now using a generic one or empty.
// Actually, let's just use label and translate 'Enter title'

const MenuManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { showAlert, showConfirm } = useModal();
  const [menus, setMenus] = useState<MenuData[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<MenuData | null>(null);
  const [formData, setFormData] = useState<Partial<MenuData>>({});
  const [loading, setLoading] = useState(true);

  const fetchMenus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<MenuData[]>('/api/v1/system/menus');
      setMenus(data);
    } catch (error) {
      console.error("Error fetching menus:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  useEffect(() => {
    if (selectedMenu) {
      setFormData(selectedMenu);
    }
  }, [selectedMenu]);

  const handleCreateNew = () => {
    setSelectedMenu(null);
    const topLevelSort = menus.filter(m => m.parentId === null).length + 1;
    setFormData({ parentId: null, isVisible: 'Y', sortOrder: topLevelSort, title: '', path: '', icon: '', translations: {} });
  };

  const handleCreateChild = (parentId: number) => {
    const childrenCount = menus.filter(m => m.parentId === parentId).length + 1;
    setSelectedMenu(null);
    setFormData({ parentId: parentId, isVisible: 'Y', sortOrder: childrenCount, title: '', path: '', icon: '', translations: {} });
  }

  const handleSave = () => {
    if (!formData.title) {
        showAlert({ title: t('common.input_error', '입력 오류'), message: t('menu.title_required', '메뉴명을 입력해주세요.') });
        return;
    }
    const isEdit = !!formData.id;
    showConfirm({
      title: isEdit ? t('common.edit', '수정') : t('common.add', '추가'),
      message: isEdit
        ? t('menu.confirm_update', '메뉴 정보를 수정하시겠습니까?')
        : t('menu.confirm_create', '새 메뉴를 생성하시겠습니까?'),
      confirmText: t('common.save', '저장'),
      onConfirm: async () => {
        try {
          await apiClient.post('/api/v1/system/menus', formData);
          showAlert({ title: t('common.save_complete', '저장 완료'), message: t('menu.save_success', '메뉴가 성공적으로 저장되었습니다.') });
          fetchMenus();
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          showAlert({ title: t('common.save_failed', '저장 실패'), message: t('common.save_failed_msg', '저장에 실패했습니다: ') + message });
        }
      }
    });
  };

  const handleDelete = async () => {
    if (!formData.id) return;
    
    showConfirm({
      title: t('menu.delete_confirm_title', '메뉴 삭제 확인'),
      message: t('menu.delete_confirm_msg', '정말 이 메뉴를 삭제하시겠습니까? (하위 메뉴가 있다면 오류가 발생할 수 있습니다)'),
      confirmText: t('common.delete', '삭제'),
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/v1/system/menus/${formData.id}`);
          showAlert({ title: t('common.delete_complete', '삭제 완료'), message: t('menu.delete_success', '메뉴가 삭제되었습니다.') });
          setFormData({});
          setSelectedMenu(null);
          fetchMenus();
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          showAlert({ title: t('common.delete_failed', '삭제 실패'), message: t('common.delete_failed_msg', '삭제에 실패했습니다: ') + message });
        }
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('trans_')) {
      const langCode = name.replace('trans_', '');
      setFormData(prev => ({
        ...prev,
        translations: {
          ...(prev.translations || {}),
          [langCode]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'sortOrder' ? parseInt(value) || 0 : value
      }));
    }
  };

  const getDisplayTitle = (menu: MenuData) => {
    const lang = i18n.resolvedLanguage || i18n.language || 'ko';
    const baseLang = lang.split('-')[0];

    const displayTitle = (menu.translations && menu.translations[baseLang]) || menu.title;
    return t(displayTitle);
  };

  const topLevelMenus = menus.filter(m => m.parentId === null);

  const renderMenuTree = (menuList: MenuData[], level = 0) => {
    return menuList.map(menu => {
      const children = menus.filter(m => m.parentId === menu.id);
      const isSelected = formData.id === menu.id;
      const displayTitle = getDisplayTitle(menu);
      
      return (
        <React.Fragment key={menu.id}>
          <div 
            onClick={() => { setSelectedMenu(menu); setFormData(menu); }}
            className={`menu-mgmt-tree-item ${isSelected ? 'menu-mgmt-tree-item-selected' : 'menu-mgmt-tree-item-default'}`}
            data-level={level}
          >
            <div className="menu-mgmt-tree-item-content">
              <div className="menu-mgmt-tree-item-label">
                {level === 0 ? <strong className="menu-mgmt-tree-node-icon">•</strong> : <span className="menu-mgmt-tree-leaf-icon">└</span>}
                <span className="menu-mgmt-tree-title">{displayTitle}</span>
              </div>
            </div>
            
            {isSelected && (
                <button 
                  className="btn btn-outline menu-mgmt-add-child-btn" 
                  onClick={(e) => { e.stopPropagation(); handleCreateChild(menu.id); }}
                  title={t('menu.add_child', '하위 추가')}
                  aria-label={t('menu.add_child', '하위 추가')}
                >
                  + {t('menu.add_child', '하위 추가')}
                </button>
            )}
          </div>
          {children.length > 0 && renderMenuTree(children, level + 1)}
        </React.Fragment>
      );
    });
  };

  const headerActions = (
    <button className="btn btn-primary" onClick={handleCreateNew}><Plus size={18} /> {t('menu.add_top', '최상위 메뉴 추가')}</button>
  );

  return (
    <div className="page-container">
      <PageHeader 
        title={t('menu.page_title', '메뉴/페이지 관리')} 
        description={t('menu.page_desc', '시스템의 좌측 사이드바 메뉴 및 라우팅 경로를 설정합니다.')}
        breadcrumbs={[t('sidebar.system_management', '시스템 관리'), t('menu.page_title', '메뉴/페이지 관리')]}
        actions={headerActions}
      />

      <div className="split-view-container">
        {/* Left: Menu Tree */}
        <Card title={t('menu.structure', '메뉴 구조')} noPadding className="split-view-left code-mgmt-list-card">
          <div className="menu-mgmt-tree-container">
            {loading ? (
                <div className="menu-mgmt-loading">{t('menu.loading', '데이터 로딩...')}</div>
            ) : (
                <div className="menu-mgmt-tree-wrapper">
                  {renderMenuTree(topLevelMenus)}
                </div>
            )}
          </div>
        </Card>

        {/* Right: Selected Menu Details */}
        <Card title={formData.id ? t('menu.edit_detail', '메뉴 상세 수정') : Object.keys(formData).length > 0 ? t('menu.create_new', '신규 메뉴 생성') : t('menu.detail_settings', '메뉴 상세 설정')} className="split-view-right" headerActions={
          Object.keys(formData).length > 0 && (
             <div className="menu-mgmt-actions">
                {formData.id && (
                  <button className="btn btn-outline menu-mgmt-delete-btn" onClick={handleDelete} title={t('common.delete', '삭제')} aria-label={t('common.delete', '삭제')}><Trash2 size={16} /> {t('common.delete', '삭제')}</button>
                )}
                <button className="btn btn-primary" onClick={handleSave} title={t('common.save', '저장')} aria-label={t('common.save', '저장')}><Save size={16} /> {t('common.save', '저장')}</button>
             </div>
          )
        }>
          {Object.keys(formData).length > 0 ? (
            <div className="menu-mgmt-form-container">
              <div className="menu-mgmt-form-group">
                <label className="form-label">{t('menu.parent_id', '상위 메뉴 ID')}</label>
                <div className="menu-mgmt-form-id-wrapper">
                  <input type="text" className="form-input" value={formData.parentId === null ? t('menu.top_level', '최상위 메뉴') : formData.parentId} readOnly title={t('menu.parent_id', '상위 메뉴 ID')} placeholder={t('menu.parent_id', '상위 메뉴 ID')} />
                  <span className="menu-mgmt-form-id-hint">{t('menu.id', 'ID')}: {formData.id || '(신규)'}</span>
                </div>
              </div>
              
              <div className="menu-mgmt-form-group">
                <label className="form-label">{t('menu.title_key', '메뉴 키 (i18n Key)')}</label>
                <input type="text" className="form-input" name="title" value={formData.title || ''} onChange={handleChange} title={t('menu.title_key', '메뉴 키')} placeholder="sidebar.menu_name" />
              </div>

              <div className="menu-mgmt-translations-grid">
                {supportedLanguages.map(lang => (
                  <div key={lang.code} className="menu-mgmt-form-group">
                    <label className="form-label">{lang.label} ({lang.code.toUpperCase()})</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name={`trans_${lang.code}`} 
                      value={formData.translations?.[lang.code] || ''} 
                      onChange={handleChange} 
                      title={`${lang.label} ${t('menu.title_key')}`} 
                      placeholder={t('common.please_wait') === '...' ? 'Enter title' : t('menu.title_required')} 
                    />
                  </div>
                ))}
              </div>

              <div className="menu-mgmt-form-group">
                <label className="form-label">{t('menu.path', '라우팅 경로 (Path)')}</label>
                <input type="text" className="form-input" name="path" value={formData.path || ''} onChange={handleChange} placeholder="e.g., /system/users" title={t('menu.path', '라우팅 경로')} />
              </div>

              <div className="menu-mgmt-form-group">
                <label className="form-label">{t('menu.icon', '아이콘 식별자 (Icon)')}</label>
                <div className="menu-mgmt-form-col">
                  <input type="text" className="form-input" name="icon" value={formData.icon || ''} onChange={handleChange} placeholder="e.g., Home, Settings" title={t('menu.icon', '아이콘 식별자')} />
                  <div className="menu-mgmt-form-icon-hint">{t('menu.icon_hint', 'Lucide React 아이콘 명칭을 입력하세요.')}</div>
                </div>
              </div>

              <div className="menu-mgmt-form-row">
                <div className="menu-mgmt-form-group menu-mgmt-form-col">
                  <label className="form-label">{t('menu.sort_order', '정렬 순서')}</label>
                  <input type="number" className="form-input" name="sortOrder" value={formData.sortOrder || 1} onChange={handleChange} title={t('menu.sort_order', '정렬 순서')} placeholder="1" />
                </div>
                <div className="menu-mgmt-form-group menu-mgmt-form-col">
                  <label className="form-label">{t('menu.visibility', '화면 노출 여부')}</label>
                  <select className="form-input" name="isVisible" value={formData.isVisible || 'Y'} onChange={handleChange} title={t('menu.visibility', '화면 노출 여부')}>
                    <option value="Y">{t('menu.visible', '노출 (Y)')}</option>
                    <option value="N">{t('menu.hidden', '숨김 (N)')}</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="menu-mgmt-empty">
              {t('menu.empty_msg', '좌측 목록에서 메뉴를 선택하거나 우측 상단의 신규 메뉴 버튼을 클릭하세요.')}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MenuManagement;
