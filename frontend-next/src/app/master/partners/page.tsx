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
import './Partner.css';

interface PartnerData {
  id?: number;
  code: string;
  name: string;
  businessNumber: string;
  type: string;
  contact: string;
  useYn: 'Y' | 'N';
}

const PartnerManagement: React.FC = () => {
    const { t } = useTranslation();
    const { showAlert, showConfirm } = useModal();
    const [partners, setPartners] = useState<PartnerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPartner, setEditingPartner] = useState<Partial<PartnerData> | null>(null);
    const [searchName, setSearchName] = useState('');

    const fetchPartners = async (nameKeyword?: string) => {
        setLoading(true);
        try {
            const url = nameKeyword ? `/api/v1/mdm/partners?name=${encodeURIComponent(nameKeyword)}` : '/api/v1/mdm/partners';
            const data = await apiClient.get<PartnerData[]>(url);
            setPartners(data);
        } catch (error) {
            console.warn("Error fetching partners:", error);
            setPartners([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartners();
    }, []);

    const handleSearch = () => {
        fetchPartners(searchName);
    };

    const handleSave = async () => {
        if (!editingPartner?.code || !editingPartner?.name) {
            showAlert({ 
                title: t('common.input_error'), 
                message: t('sales.client.messages.required', '필수 입력 필드가 누락되었습니다.') 
            });
            return;
        }

        try {
             if (editingPartner.id) {
               await apiClient.put(`/api/v1/mdm/partners/${editingPartner.id}`, editingPartner);
             } else {
               const payload = { ...editingPartner, useYn: editingPartner.useYn || 'Y' };
               await apiClient.post('/api/v1/mdm/partners', payload);
             }
             showAlert({ title: t('common.save_complete'), message: t('master.common.save_success', '성공적으로 저장되었습니다.') });
             setEditingPartner(null);
             fetchPartners();
        } catch (error: unknown) {
             const message = error instanceof Error ? error.message : String(error);
             showAlert({ title: t('common.save_failed'), message: t('common.save_failed_msg') + message });
        }
    };

    const handleDelete = (row: PartnerData) => {
        if (!row.id) return;
        showConfirm({
            title: t('common.delete'),
            message: t('sales.client.messages.delete_confirm', { name: row.name }),
            confirmText: t('common.delete'),
            onConfirm: async () => {
                try {
                    await apiClient.delete(`/api/v1/mdm/partners/${row.id}`);
                    showAlert({ title: t('common.delete_complete'), message: t('master.common.delete_success', '성공적으로 삭제되었습니다.') });
                    fetchPartners();
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : String(error);
                    showAlert({ title: t('common.delete_failed'), message: t('common.delete_failed_msg') + message });
                }
            }
        });
    };

    const columns: Column<PartnerData>[] = [
        { header: t('master.partner.code', '파트너 코드'), accessor: 'code', colWidth: '120px' },
        { header: t('master.partner.name', '파트너사명'), accessor: 'name' },
        { header: t('master.partner.biz_no', '사업자번호'), accessor: 'businessNumber', colWidth: '150px' },
        { header: t('master.partner.type', '파트너 구분'), accessor: 'type', colWidth: '150px' },
        { header: t('master.partner.contact', '연락처'), accessor: 'contact', colWidth: '150px' },
        {
            header: t('master.partner.use_yn', '사용 여부'),
            accessor: (row) => (
                <span className={`partner-use-badge ${row.useYn}`}>
                    {row.useYn === 'Y' ? t('code.status.use', '사용') : t('code.status.unused', '미사용')}
                </span>
            ),
            colWidth: '120px',
            align: 'center'
        },
        {
            header: t('master.common.actions', '관리'),
            accessor: (row) => (
                <div className="partner-action-cell">
                    <button className="pagination-btn" title={t('common.edit')} onClick={() => setEditingPartner(row)}>
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
        <button className="btn btn-primary" onClick={() => setEditingPartner({ useYn: 'Y', type: '운송' })}>
            <Plus size={18} /> {t('master.common.add_btn', '신규 등록')}
        </button>
    );

    return (
        <div className="template-page fade-in partner-mgmt-page">
            <PageHeader
                title={t('master.partner.title', '파트너 관리')}
                description={t('master.partner.desc', '배송, 운송, 하역 등 협력 관계인 물류 파트너사 정보를 관리합니다.')}
                breadcrumbs={[t('sidebar.master_management', '기준정보 관리'), t('sidebar.partner_management', '파트너 관리')]}
                actions={headerActions}
            />

            <Modal 
                isOpen={editingPartner !== null} 
                onClose={() => setEditingPartner(null)}
                title={editingPartner?.id ? t('common.edit', '수정') : t('master.common.add_btn', '신규 등록')}
                footer={
                    <div className="form-actions-end">
                        <button className="btn btn-outline" onClick={() => setEditingPartner(null)}>{t('common.cancel', '취소')}</button>
                        <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {t('common.save', '저장')}</button>
                    </div>
                }
            >
                {editingPartner && (
                    <div className="partner-editor-grid">
                        <InputField 
                           label={t('master.partner.code', '파트너 코드') + ' *'} 
                           value={editingPartner.code || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPartner({...editingPartner, code: e.target.value})} 
                           placeholder="e.g. PT001" 
                        />
                        <InputField 
                           label={t('master.partner.name', '파트너사명') + ' *'} 
                           value={editingPartner.name || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPartner({...editingPartner, name: e.target.value})} 
                           placeholder="e.g. (주)대한통상" 
                        />
                        <InputField 
                           label={t('master.partner.biz_no', '사업자번호')} 
                           value={editingPartner.businessNumber || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPartner({...editingPartner, businessNumber: e.target.value})} 
                           placeholder="123-45-67890" 
                        />
                        <SelectField
                            label={t('master.partner.type', '파트너 구분') + ' *'}
                            value={editingPartner.type || '운송'}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingPartner({...editingPartner, type: e.target.value})}
                            options={[
                                { value: '운송', label: '운송' },
                                { value: '배송', label: '배송' },
                                { value: '하역', label: '하역' },
                                { value: '포장', label: '포장' }
                            ]}
                        />
                        <InputField 
                           label={t('master.partner.contact', '연락처')} 
                           value={editingPartner.contact || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPartner({...editingPartner, contact: e.target.value})} 
                           placeholder="010-1234-5678" 
                        />
                        <SelectField
                            label={t('master.partner.use_yn', '사용 여부')}
                            value={editingPartner.useYn || 'Y'}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingPartner({...editingPartner, useYn: e.target.value as 'Y' | 'N'})}
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
                           label={t('master.partner.filter_name', '파트너사명')} 
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
                    <div className="partner-table-header">
                        <h3 className="section-title">
                            {t('master.partner.list_title', '파트너사 목록')} (<span className="accent-text">{partners.length}</span>)
                        </h3>
                    </div>
                    {loading ? (
                        <div className="partner-msg-loading">{t('sales.common.loading', '데이터 로딩 중...')}</div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={partners}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default PartnerManagement;
