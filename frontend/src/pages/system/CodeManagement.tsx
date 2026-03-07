import React, { useState, useCallback } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Plus, Edit2, Trash2, Power, Save } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';
import { useModal } from '../../contexts/ModalContext';
import { useTranslation } from 'react-i18next';
import './CodeManagement.css';

interface MasterCode {
  id: string;
  name: string;
  description: string;
  translations: Record<string, string>;
}

interface DetailCode {
  id?: number;
  masterCodeId: string;
  code: string;
  label: string;
  sortOrder: number;
  useYn: 'Y' | 'N';
  translations: Record<string, string>;
}

const CodeManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { showAlert, showConfirm } = useModal();
  const [masterCodes, setMasterCodes] = useState<MasterCode[]>([]);
  const [selectedMaster, setSelectedMaster] = useState<MasterCode | null>(null);
  const [detailCodes, setDetailCodes] = useState<DetailCode[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const supportedLanguages = [
    { code: 'ko', label: t('common.languages.ko') },
    { code: 'en', label: t('common.languages.en') },
    { code: 'ja', label: t('common.languages.ja') },
    { code: 'zh', label: t('common.languages.zh') }
  ];

  const getDisplayName = (code: MasterCode | DetailCode, fallbackField: 'name' | 'label') => {
    const lang = i18n.resolvedLanguage || i18n.language || 'ko';
    const baseLang = lang.split('-')[0];
    if (code.translations && code.translations[baseLang]) {
        return code.translations[baseLang];
    }
    if (fallbackField === 'name' && 'name' in code) return (code as MasterCode).name;
    if (fallbackField === 'label' && 'label' in code) return (code as DetailCode).label;
    return '';
  };

  const [editingMaster, setEditingMaster] = useState<Partial<MasterCode> | null>(null);
  const [editingDetail, setEditingDetail] = useState<Partial<DetailCode> | null>(null);

  const fetchMasterCodes = useCallback(async () => {
    try {
      setLoadingMaster(true);
      const data = await apiClient.get<MasterCode[]>('/api/v1/system/codes/master');
      setMasterCodes(data);
    } catch (error) {
      console.error("Error fetching master codes:", error);
    } finally {
      setLoadingMaster(false);
    }
  }, []);

  const fetchDetailCodes = useCallback(async (masterId: string) => {
    setLoadingDetail(true);
    try {
      const data = await apiClient.get<DetailCode[]>(`/api/v1/system/codes/detail/${masterId}`);
      setDetailCodes(data);
    } catch (error) {
      console.error("Error fetching detail codes:", error);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMasterCodes();
  }, [fetchMasterCodes]);

  React.useEffect(() => {
    if (selectedMaster) {
      fetchDetailCodes(selectedMaster.id);
      setEditingDetail(null); 
    } else {
      setDetailCodes([]);
    }
  }, [selectedMaster, fetchDetailCodes]);

  const handleSaveMaster = () => {
    if (!editingMaster?.id || !editingMaster.name) {
      showAlert({ title: t('common.input_error'), message: t('code.messages.input_error_master') });
      return;
    }
    showConfirm({
      title: editingMaster.id && masterCodes.some(m => m.id === editingMaster.id && m.id !== '') ? t('common.edit') : t('common.add'),
      message: t('code.messages.confirm_save_master'),
      confirmText: t('common.save'),
      onConfirm: async () => {
        try {
          await apiClient.post('/api/v1/system/codes/master', editingMaster);
          showAlert({ title: t('common.save_complete'), message: t('code.messages.save_success_master') });
          setEditingMaster(null);
          fetchMasterCodes();
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          showAlert({ title: t('common.save_failed'), message: t('common.save_failed_msg') + message });
        }
      }
    });
  };

  const handleDeleteMaster = async (id: string, name: string) => {
    showConfirm({
      title: t('code.messages.delete_confirm_title_master'),
      message: t('code.messages.delete_confirm_msg_master', { name }),
      confirmText: t('common.delete'),
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/v1/system/codes/master/${id}`);
          showAlert({ title: t('common.delete_complete'), message: t('code.messages.delete_success_master') });
          if (selectedMaster?.id === id) setSelectedMaster(null);
          fetchMasterCodes();
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          showAlert({ title: t('common.delete_failed'), message: t('common.delete_failed_msg') + message });
        }
      }
    });
  };

  const handleSaveDetail = () => {
    if (!selectedMaster) return;
    if (!editingDetail?.code || !editingDetail.label) {
      showAlert({ title: t('common.input_error'), message: t('code.messages.input_error_detail') });
      return;
    }
    showConfirm({
      title: editingDetail.id ? t('common.edit') : t('common.add'),
      message: t('code.messages.confirm_save_detail'),
      confirmText: t('common.save'),
      onConfirm: async () => {
        const submitData = { ...editingDetail, masterCodeId: selectedMaster.id };
        try {
          await apiClient.post('/api/v1/system/codes/detail', submitData);
          showAlert({ title: t('common.save_complete'), message: t('code.messages.save_success_detail') });
          setEditingDetail(null);
          fetchDetailCodes(selectedMaster.id);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          showAlert({ title: t('common.save_failed'), message: t('common.save_failed_msg') + message });
        }
      }
    });
  };

  const handleDeleteDetail = async (id: number, label: string) => {
    if (!selectedMaster) return;
    showConfirm({
      title: t('code.messages.delete_confirm_title_detail'),
      message: t('code.messages.delete_confirm_msg_detail', { label }),
      confirmText: t('common.delete'),
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/v1/system/codes/detail/${id}`);
          showAlert({ title: t('common.delete_complete'), message: t('code.messages.delete_success_detail') });
          fetchDetailCodes(selectedMaster.id);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          showAlert({ title: t('common.delete_failed'), message: t('common.delete_failed_msg') + message });
        }
      }
    });
  };

  const setDetailUseYn = async (detail: DetailCode, useYn: 'Y' | 'N') => {
      try {
        const updated = { ...detail, useYn };
        await apiClient.post('/api/v1/system/codes/detail', updated);
        fetchDetailCodes(detail.masterCodeId);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        showAlert({ title: '상태 변경 오류', message: '상태 변경에 실패했습니다: ' + message });
      }
  }

  const masterColumns: Column<MasterCode>[] = [
    { header: t('code.fields.master_id'), accessor: 'id' },
    { header: t('code.fields.name'), accessor: (row) => getDisplayName(row, 'name') },
    {
        header: t('common.actions'),
        accessor: (row) => (
          <div className="code-mgmt-table-actions">
            <button className="pagination-btn" title={t('code.actions.edit_tooltip')} onClick={(e) => { e.stopPropagation(); setEditingMaster(row); }}><Edit2 size={16} /></button>
            <button className="pagination-btn" title={t('code.actions.delete_tooltip')} onClick={(e) => { e.stopPropagation(); handleDeleteMaster(row.id, row.name); }}><Trash2 size={16} color="var(--status-danger)" /></button>
          </div>
        ),
        colWidth: '100px', align: 'center'
      }
  ];

  const detailColumns: Column<DetailCode>[] = [
    { header: t('code.fields.detail_code'), accessor: 'code', colWidth: '100px' },
    { header: t('code.fields.label'), accessor: (row) => getDisplayName(row, 'label') },
    { header: t('code.fields.sort_order'), accessor: 'sortOrder', align: 'center', colWidth: '100px' },
    { 
      header: t('code.fields.use_yn'), 
      accessor: (row) => (
        <span className={`code-useyn-badge ${row.useYn === 'Y' ? 'badge-y' : 'badge-n'}`}>
          {row.useYn === 'Y' ? t('code.status.use') : t('code.status.unused')}
        </span>
      ),
      colWidth: '100px', align: 'center'
    },
    {
      header: t('common.actions'),
      accessor: (row) => (
        <div className="code-mgmt-table-actions">
          <button className="pagination-btn" title={t('code.actions.edit_tooltip')} onClick={(e) => { e.stopPropagation(); setEditingDetail(row); }}><Edit2 size={16} /></button>
          <button className="pagination-btn" title={t('code.actions.status_toggle_tooltip')} onClick={(e) => { e.stopPropagation(); setDetailUseYn(row, row.useYn === 'Y' ? 'N' : 'Y'); }}><Power size={16} /></button>
          <button className="pagination-btn" title={t('code.actions.delete_tooltip')} onClick={(e) => { e.stopPropagation(); if (row.id) handleDeleteDetail(row.id, row.label); }}><Trash2 size={16} color="var(--status-danger)" /></button>
        </div>
      ),
      colWidth: '120px', align: 'center'
    }
  ];

  return (
    <div className="template-page fade-in code-mgmt-page">
      <PageHeader 
        title={t('code.master_title')} 
        description={t('code.page_desc')}
        breadcrumbs={[t('sidebar.system_management'), t('code.master_title')]}
        actions={
          <button className="btn btn-outline" onClick={() => setEditingMaster({ id: '', name: '', description: '', translations: {} })}>
            <Plus size={18} /> {t('code.actions.add_master')}
          </button>
        }
      />

      {/* Master Code Modal */}
      <Modal 
        isOpen={editingMaster !== null} 
        onClose={() => setEditingMaster(null)}
        title={editingMaster?.id && masterCodes.some(m => m.id === editingMaster.id && m.id !== '') ? t('code.master_editor_edit') : t('code.master_editor_new')}
        size="lg"
      >
        {editingMaster && (
          <div className="modal-form-content">
            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">{t('code.fields.master_id')}</label>
                <input type="text" className="form-input" value={editingMaster.id || ''} onChange={(e) => setEditingMaster({...editingMaster, id: e.target.value})} readOnly={masterCodes.some(m => m.id === editingMaster.id && m.id !== '')} placeholder="e.g., USER_STS" />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">{t('code.fields.name')} ({t('code.fields.base')})</label>
                <input type="text" className="form-input" value={editingMaster.name || ''} onChange={(e) => setEditingMaster({...editingMaster, name: e.target.value})} placeholder="e.g., 사용자 상태" />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label mb-3 mt-2">{t('menu.translations')} ({t('code.fields.name')})</label>
              <div className="code-mgmt-lang-grid">
                {supportedLanguages.map(lang => (
                  <div key={lang.code} className="translation-input-item">
                    <span className="lang-label">{lang.label}</span>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editingMaster.translations?.[lang.code] || ''} 
                      onChange={(e) => setEditingMaster({
                        ...editingMaster, 
                        translations: { ...editingMaster.translations, [lang.code]: e.target.value }
                      })} 
                      placeholder={t(`common.languages.${lang.code}`)}
                      title={`${lang.label} ${t('code.fields.name')}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">설명</label>
              <input type="text" className="form-input" value={editingMaster.description || ''} onChange={(e) => setEditingMaster({...editingMaster, description: e.target.value})} title="설명" placeholder="코드 설명을 입력하세요" />
            </div>
            <div className="modal-footer-actions mt-4 pt-3 border-top">
              <button className="btn btn-outline" onClick={() => setEditingMaster(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSaveMaster}><Save size={16} /> {t('common.save')}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Detail Code Modal */}
      <Modal 
        isOpen={editingDetail !== null} 
        onClose={() => setEditingDetail(null)}
        title={editingDetail?.id ? t('code.detail_editor_edit') : t('code.detail_editor_new')}
        size="lg"
      >
        {editingDetail && (
          <div className="modal-form-content">
            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">{t('code.fields.detail_code')}</label>
                <input type="text" className="form-input" value={editingDetail.code || ''} onChange={(e) => setEditingDetail({...editingDetail, code: e.target.value})} placeholder="e.g., ACTIVE" />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">{t('code.fields.label')} ({t('code.fields.base')})</label>
                <input type="text" className="form-input" value={editingDetail.label || ''} onChange={(e) => setEditingDetail({...editingDetail, label: e.target.value})} placeholder="e.g., 활성" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label mb-3 mt-2">{t('menu.translations')} ({t('code.fields.label')})</label>
              <div className="code-mgmt-lang-grid">
                {supportedLanguages.map(lang => (
                  <div key={lang.code} className="translation-input-item">
                    <span className="lang-label">{lang.label}</span>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editingDetail.translations?.[lang.code] || ''} 
                      onChange={(e) => setEditingDetail({
                        ...editingDetail, 
                        translations: { ...editingDetail.translations, [lang.code]: e.target.value }
                      })} 
                      placeholder={t(`common.languages.${lang.code}`)}
                      title={`${lang.label} ${t('code.fields.label')}`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">{t('code.fields.sort_order')}</label>
                <input type="number" className="form-input" value={editingDetail.sortOrder || 1} onChange={(e) => setEditingDetail({...editingDetail, sortOrder: parseInt(e.target.value) || 1})} title={t('code.fields.sort_order')} />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">{t('code.fields.use_yn')}</label>
                <select className="form-input" value={editingDetail.useYn || 'Y'} onChange={(e) => setEditingDetail({...editingDetail, useYn: e.target.value as 'Y' | 'N'})} title={t('code.fields.use_yn')}>
                  <option value="Y">{t('code.status.use')} (Y)</option>
                  <option value="N">{t('code.status.unused')} (N)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer-actions mt-4 pt-3 border-top">
              <button className="btn btn-outline" onClick={() => setEditingDetail(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSaveDetail}><Save size={16} /> {t('common.save')}</button>
            </div>
          </div>
        )}
      </Modal>

      <div className="code-mgmt-main-grid">
        <Card title={t('code.master_title')} noPadding className="split-view-left code-mgmt-list-card">
          <div className="code-mgmt-list-content">
            {loadingMaster ? (
              <div className="code-mgmt-loading">{t('code.messages.master_loading')}</div>
            ) : (
              <DataTable columns={masterColumns} data={masterCodes} onRowClick={(row) => setSelectedMaster(row)} selectedRowId={selectedMaster?.id} />
            )}
          </div>
        </Card>

        <Card 
          title={selectedMaster ? `[${getDisplayName(selectedMaster, 'name')}] ${t('code.detail_title')}` : t('code.messages.select_master')} 
          className="split-view-right code-mgmt-list-card" 
          noPadding
          headerActions={
            selectedMaster && <button className="btn btn-primary" onClick={() => setEditingDetail({ masterCodeId: selectedMaster.id, code: '', label: '', sortOrder: detailCodes.length + 1, useYn: 'Y', translations: {} })}><Plus size={16} /> {t('code.actions.add_detail')}</button>
          }
        >
          {selectedMaster ? (
            <div className="code-mgmt-list-content">
              <div className="code-mgmt-detail-desc mb-3 p-3 bg-light rounded shadow-sm border">
                <strong className="text-secondary">{t('code.fields.description')}:</strong> <span className="text-dark">{selectedMaster.description}</span>
              </div>
              {loadingDetail ? (
                <div className="code-mgmt-loading">{t('code.messages.detail_loading')}</div>
              ) : (
                <DataTable columns={detailColumns} data={detailCodes} />
              )}
            </div>
          ) : (
            <div className="code-mgmt-empty">{t('code.messages.select_master')}</div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CodeManagement;
