'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { DataTable, Column } from '../../../components/common/DataTable';
import { InputField, SelectField } from '../../../components/common/FormFields';
import { Modal } from '../../../components/common/Modal';
import { Search, Plus, Save, Edit2, Trash2 } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import { useModal } from '../../../contexts/ModalContext';
import './Corporation.css';

interface CorporationData {
  id?: number;
  code: string;
  name: string;
  businessNumber: string;
  address: string;
  useYn: 'Y' | 'N';
}

const CorporationManagement: React.FC = () => {
    const { t } = useTranslation();
    const { showAlert, showConfirm } = useModal();
    const [corporations, setCorporations] = useState<CorporationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCorp, setEditingCorp] = useState<Partial<CorporationData> | null>(null);
    const [searchName, setSearchName] = useState('');

    const fetchCorporations = async (nameKeyword?: string) => {
        setLoading(true);
        try {
            const url = nameKeyword ? `/api/v1/mdm/corporations?name=${encodeURIComponent(nameKeyword)}` : '/api/v1/mdm/corporations';
            const data = await apiClient.get<CorporationData[]>(url);
            setCorporations(data);
        } catch (error) {
            console.warn("Error fetching corporations:", error);
            setCorporations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCorporations();
    }, []);

    const handleSearch = () => {
        fetchCorporations(searchName);
    };

    const handleSave = async () => {
        if (!editingCorp?.code || !editingCorp?.name) {
            showAlert({ 
                title: t('common.input_error'), 
                message: t('sales.client.messages.required', '필수 입력 필드가 누락되었습니다.') 
            });
            return;
        }

        try {
             if (editingCorp.id) {
               await apiClient.put(`/api/v1/mdm/corporations/${editingCorp.id}`, editingCorp);
             } else {
               const payload = { ...editingCorp, useYn: editingCorp.useYn || 'Y' };
               await apiClient.post('/api/v1/mdm/corporations', payload);
             }
             showAlert({ title: t('common.save_complete'), message: t('master.common.save_success', '성공적으로 저장되었습니다.') });
             setEditingCorp(null);
             fetchCorporations();
        } catch (error: unknown) {
             const message = error instanceof Error ? error.message : String(error);
             showAlert({ title: t('common.save_failed'), message: t('common.save_failed_msg') + message });
        }
    };

    const handleDelete = (row: CorporationData) => {
        if (!row.id) return;
        showConfirm({
            title: t('common.delete'),
            message: t('sales.client.messages.delete_confirm', { name: row.name }),
            confirmText: t('common.delete'),
            onConfirm: async () => {
                try {
                    await apiClient.delete(`/api/v1/mdm/corporations/${row.id}`);
                    showAlert({ title: t('common.delete_complete'), message: t('master.common.delete_success', '성공적으로 삭제되었습니다.') });
                    fetchCorporations();
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : String(error);
                    showAlert({ title: t('common.delete_failed'), message: t('common.delete_failed_msg') + message });
                }
            }
        });
    };

    const columns: Column<CorporationData>[] = [
        { header: t('master.corp.code', '법인 코드'), accessor: 'code', colWidth: '120px' },
        { header: t('master.corp.name', '법인명'), accessor: 'name' },
        { header: t('master.corp.biz_no', '사업자번호'), accessor: 'businessNumber', colWidth: '150px' },
        { header: t('master.corp.address', '법인 주소'), accessor: 'address' },
        {
            header: t('master.corp.use_yn', '사용 여부'),
            accessor: (row) => (
                <span className={`corp-use-badge ${row.useYn}`}>
                    {row.useYn === 'Y' ? t('code.status.use', '사용') : t('code.status.unused', '미사용')}
                </span>
            ),
            colWidth: '120px',
            align: 'center'
        },
        {
            header: t('master.common.actions', '관리'),
            accessor: (row) => (
                <div className="corp-action-cell">
                    <button className="pagination-btn" title={t('common.edit')} onClick={() => setEditingCorp(row)}>
                        <Edit2 size={16} />
                    </button>
                    <button className="pagination-btn" title={t('common.delete')} onClick={() => handleDelete(row)}>
                        <Trash2 size={16} color="var(--status-danger)" />
                    </button>
                </div>
            ),
            colWidth: '120px',
            align: 'center'
        }
    ];

    const headerActions = (
        <button className="btn btn-primary" onClick={() => setEditingCorp({ useYn: 'Y' })}>
            <Plus size={18} /> {t('master.common.add_btn', '신규 등록')}
        </button>
    );

    return (
        <div className="template-page fade-in corp-mgmt-page">
            <PageHeader
                title={t('master.corp.title', '법인 관리')}
                description={t('master.corp.desc', '시스템에 등록된 전체 법인/회사 정보를 등록하고 관리합니다.')}
                breadcrumbs={[t('sidebar.master_management', '기준정보 관리'), t('sidebar.corporation_management', '법인 관리')]}
                actions={headerActions}
            />

            <Modal 
                isOpen={editingCorp !== null} 
                onClose={() => setEditingCorp(null)}
                title={editingCorp?.id ? t('common.edit', '수정') : t('master.common.add_btn', '신규 등록')}
                footer={
                    <div className="form-actions-end">
                        <button className="btn btn-outline" onClick={() => setEditingCorp(null)}>{t('common.cancel', '취소')}</button>
                        <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {t('common.save', '저장')}</button>
                    </div>
                }
            >
                {editingCorp && (
                    <div className="corp-editor-grid">
                        <InputField 
                           label={t('master.corp.code', '법인 코드') + ' *'} 
                           value={editingCorp.code || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCorp({...editingCorp, code: e.target.value})} 
                           placeholder="e.g. CORP001" 
                        />
                        <InputField 
                           label={t('master.corp.name', '법인명') + ' *'} 
                           value={editingCorp.name || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCorp({...editingCorp, name: e.target.value})} 
                           placeholder="e.g. (주)로지스틱스" 
                        />
                        <InputField 
                           label={t('master.corp.biz_no', '사업자번호')} 
                           value={editingCorp.businessNumber || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCorp({...editingCorp, businessNumber: e.target.value})} 
                           placeholder="123-45-67890" 
                        />
                        <InputField 
                           label={t('master.corp.address', '법인 주소')} 
                           value={editingCorp.address || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCorp({...editingCorp, address: e.target.value})} 
                           placeholder="서울특별시 강남구 테헤란로..." 
                        />
                        <SelectField
                            label={t('master.corp.use_yn', '사용 여부')}
                            value={editingCorp.useYn || 'Y'}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingCorp({...editingCorp, useYn: e.target.value as 'Y' | 'N'})}
                            options={[
                                { value: 'Y', label: t('code.status.use', '사용') },
                                { value: 'N', label: t('code.status.unused', '미사용') }
                            ]}
                        />
                    </div>
                )}
            </Modal>

            <div className="flex flex-col gap-24">
                <Card title={t('sales.client.filter_title', '검색 필터')} collapsible>
                    <div className="filter-panel horizontal grid-5">
                        <InputField 
                           label={t('master.corp.name', '법인명')} 
                           value={searchName} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchName(e.target.value)} 
                           placeholder="검색어 입력..." 
                           fullWidth={false}
                        />
                        <div className="filter-actions">
                            <button className="btn btn-primary" onClick={handleSearch}>
                                 <Search size={18} />
                                 {t('master.common.search_btn', '조회')}
                            </button>
                        </div>
                    </div>
                </Card>

                <Card noPadding>
                    <div className="corp-table-header">
                        <h3 className="section-title">
                            {t('master.corp.list_title', '법인 목록')} (<span className="accent-text">{corporations.length}</span>)
                        </h3>
                    </div>
                    {loading ? (
                        <div className="corp-msg-loading">{t('sales.common.loading', '데이터 로딩 중...')}</div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={corporations}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default CorporationManagement;
