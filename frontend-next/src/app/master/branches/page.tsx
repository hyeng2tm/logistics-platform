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
import './Branch.css';

interface CorporationData {
  id: number;
  code: string;
  name: string;
}

interface BranchData {
  id?: number;
  code: string;
  name: string;
  corporationId: number;
  corporationName?: string; // Client-side mapped
  address: string;
  useYn: 'Y' | 'N';
}

const BranchManagement: React.FC = () => {
    const { t } = useTranslation();
    const { showAlert, showConfirm } = useModal();
    const [branches, setBranches] = useState<BranchData[]>([]);
    const [corporations, setCorporations] = useState<CorporationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBranch, setEditingBranch] = useState<Partial<BranchData> | null>(null);
    const [searchName, setSearchName] = useState('');

    const fetchData = async (nameKeyword?: string) => {
        setLoading(true);
        try {
            // Fetch corps first for mapping
            const corpsData = await apiClient.get<CorporationData[]>('/api/v1/mdm/corporations');
            setCorporations(corpsData);

            // Fetch branches
            const url = nameKeyword ? `/api/v1/mdm/branches?name=${encodeURIComponent(nameKeyword)}` : '/api/v1/mdm/branches';
            const branchesData = await apiClient.get<BranchData[]>(url);
            
            // Map corp names
            const mappedBranches = branchesData.map(b => ({
                ...b,
                corporationName: corpsData.find(c => c.id === b.corporationId)?.name || `ID: ${b.corporationId}`
            }));
            setBranches(mappedBranches);
        } catch (error) {
            console.warn("Error fetching branch data:", error);
            setBranches([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = () => {
        fetchData(searchName);
    };

    const handleSave = async () => {
        if (!editingBranch?.code || !editingBranch?.name || !editingBranch?.corporationId) {
            showAlert({ 
                title: t('common.input_error'), 
                message: t('sales.client.messages.required', '필수 입력 필드가 누락되었습니다.') 
            });
            return;
        }

        try {
             if (editingBranch.id) {
               await apiClient.put(`/api/v1/mdm/branches/${editingBranch.id}`, editingBranch);
             } else {
               const payload = { ...editingBranch, useYn: editingBranch.useYn || 'Y' };
               await apiClient.post('/api/v1/mdm/branches', payload);
             }
             showAlert({ title: t('common.save_complete'), message: t('master.common.save_success', '성공적으로 저장되었습니다.') });
             setEditingBranch(null);
             fetchData();
        } catch (error: unknown) {
             const message = error instanceof Error ? error.message : String(error);
             showAlert({ title: t('common.save_failed'), message: t('common.save_failed_msg') + message });
        }
    };

    const handleDelete = (row: BranchData) => {
        if (!row.id) return;
        showConfirm({
            title: t('common.delete'),
            message: t('sales.client.messages.delete_confirm', { name: row.name }),
            confirmText: t('common.delete'),
            onConfirm: async () => {
                try {
                    await apiClient.delete(`/api/v1/mdm/branches/${row.id}`);
                    showAlert({ title: t('common.delete_complete'), message: t('master.common.delete_success', '성공적으로 삭제되었습니다.') });
                    fetchData();
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : String(error);
                    showAlert({ title: t('common.delete_failed'), message: t('common.delete_failed_msg') + message });
                }
            }
        });
    };

    const columns: Column<BranchData>[] = [
        { header: t('master.branch.code', '지점 코드'), accessor: 'code', colWidth: '120px' },
        { header: t('master.branch.name', '지점명'), accessor: 'name' },
        { header: t('master.branch.corp', '소속 법인'), accessor: 'corporationName', colWidth: '150px' },
        { header: t('master.branch.address', '지점 주소'), accessor: 'address' },
        {
            header: t('master.branch.use_yn', '사용 여부'),
            accessor: (row) => (
                <span className={`branch-use-badge ${row.useYn}`}>
                    {row.useYn === 'Y' ? t('code.status.use', '사용') : t('code.status.unused', '미사용')}
                </span>
            ),
            colWidth: '120px',
            align: 'center'
        },
        {
            header: t('master.common.actions', '관리'),
            accessor: (row) => (
                <div className="branch-action-cell">
                    <button className="pagination-btn" title={t('common.edit')} onClick={() => setEditingBranch(row)}>
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
        <button className="btn btn-primary" onClick={() => setEditingBranch({ useYn: 'Y', corporationId: corporations[0]?.id })}>
            <Plus size={18} /> {t('master.common.add_btn', '신규 등록')}
        </button>
    );

    return (
        <div className="template-page fade-in branch-mgmt-page">
            <PageHeader
                title={t('master.branch.title', '지점 관리')}
                description={t('master.branch.desc', '각 법인 산하의 지점 및 오피스 정보를 관리합니다.')}
                breadcrumbs={[t('sidebar.master_management', '기준정보 관리'), t('sidebar.branch_management', '지점 관리')]}
                actions={headerActions}
            />

            <Modal 
                isOpen={editingBranch !== null} 
                onClose={() => setEditingBranch(null)}
                title={editingBranch?.id ? t('common.edit', '수정') : t('master.common.add_btn', '신규 등록')}
                footer={
                    <div className="form-actions-end">
                        <button className="btn btn-outline" onClick={() => setEditingBranch(null)}>{t('common.cancel', '취소')}</button>
                        <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {t('common.save', '저장')}</button>
                    </div>
                }
            >
                {editingBranch && (
                    <div className="branch-editor-grid">
                        <InputField 
                           label={t('master.branch.code', '지점 코드') + ' *'} 
                           value={editingBranch.code || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingBranch({...editingBranch, code: e.target.value})} 
                           placeholder="e.g. BR001" 
                        />
                        <InputField 
                           label={t('master.branch.name', '지점명') + ' *'} 
                           value={editingBranch.name || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingBranch({...editingBranch, name: e.target.value})} 
                           placeholder="e.g. 강남 지점" 
                        />
                        <SelectField
                            label={t('master.branch.corp', '소속 법인') + ' *'}
                            value={editingBranch.corporationId?.toString() || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingBranch({...editingBranch, corporationId: parseInt(e.target.value)})}
                            options={[
                                { value: '', label: t('common.select', '선택하세요') },
                                ...corporations.map(c => ({ value: c.id.toString(), label: c.name }))
                            ]}
                        />
                        <InputField 
                           label={t('master.branch.address', '지점 주소')} 
                           value={editingBranch.address || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingBranch({...editingBranch, address: e.target.value})} 
                           placeholder="서울특별시 강남구..." 
                        />
                        <SelectField
                            label={t('master.branch.use_yn', '사용 여부')}
                            value={editingBranch.useYn || 'Y'}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingBranch({...editingBranch, useYn: e.target.value as 'Y' | 'N'})}
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
                           label={t('master.branch.name', '지점명')} 
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
                    <div className="branch-table-header">
                        <h3 className="section-title">
                            {t('master.branch.list_title', '지점 목록')} (<span className="accent-text">{branches.length}</span>)
                        </h3>
                    </div>
                    {loading ? (
                        <div className="branch-msg-loading">{t('sales.common.loading', '데이터 로딩 중...')}</div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={branches}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default BranchManagement;
