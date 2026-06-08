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
import './Mapping.css';

interface CorporationData {
  id: number;
  code: string;
  name: string;
}

interface BranchData {
  id: number;
  code: string;
  name: string;
  corporationId: number;
}

interface WarehouseData {
  id: number;
  code: string;
  name: string;
  corporationId: number;
}

interface UserData {
  id: string;
  name: string;
  username: string;
}

interface MappingData {
  id?: number;
  corporationId: number;
  corporationName?: string;
  branchId: number;
  branchName?: string;
  userId: string;
  userName?: string;
  warehouseId: number;
  warehouseName?: string;
  useYn: 'Y' | 'N';
}

const MappingManagement: React.FC = () => {
    const { t } = useTranslation();
    const { showAlert, showConfirm } = useModal();
    const [mappings, setMappings] = useState<MappingData[]>([]);
    const [corporations, setCorporations] = useState<CorporationData[]>([]);
    const [branches, setBranches] = useState<BranchData[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingMapping, setEditingMapping] = useState<Partial<MappingData> | null>(null);
    const [searchUserId, setSearchUserId] = useState('');

    const fetchData = async (userIdKeyword?: string) => {
        setLoading(true);
        try {
            // Fetch dependencies in parallel
            const [corpsData, branchesData, warehousesData, usersData] = await Promise.all([
                apiClient.get<CorporationData[]>('/api/v1/mdm/corporations'),
                apiClient.get<BranchData[]>('/api/v1/mdm/branches'),
                apiClient.get<WarehouseData[]>('/api/v1/mdm/warehouses'),
                apiClient.get<UserData[]>('/api/v1/system/users')
            ]);

            setCorporations(corpsData);
            setBranches(branchesData);
            setWarehouses(warehousesData);
            setUsers(usersData);

            // Fetch mappings
            const url = userIdKeyword ? `/api/v1/mdm/mappings?userId=${encodeURIComponent(userIdKeyword)}` : '/api/v1/mdm/mappings';
            const mappingsData = await apiClient.get<MappingData[]>(url);

            // Map IDs to Names
            const mappedMappings = mappingsData.map(m => {
                const corp = corpsData.find(c => c.id === m.corporationId);
                const br = branchesData.find(b => b.id === m.branchId);
                const wh = warehousesData.find(w => w.id === m.warehouseId);
                const usr = usersData.find(u => u.id === m.userId);

                return {
                    ...m,
                    corporationName: corp ? corp.name : `ID: ${m.corporationId}`,
                    branchName: br ? br.name : `ID: ${m.branchId}`,
                    warehouseName: wh ? wh.name : `ID: ${m.warehouseId}`,
                    userName: usr ? `${usr.name} (${usr.id})` : m.userId
                };
            });

            setMappings(mappedMappings);
        } catch (error) {
            console.warn("Error fetching mapping data:", error);
            setMappings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = () => {
        fetchData(searchUserId);
    };

    const handleSave = async () => {
        if (!editingMapping?.corporationId || !editingMapping?.branchId || !editingMapping?.userId || !editingMapping?.warehouseId) {
            showAlert({ 
                title: t('common.input_error'), 
                message: t('sales.client.messages.required', '필수 입력 필드가 누락되었습니다.') 
            });
            return;
        }

        try {
             if (editingMapping.id) {
               await apiClient.put(`/api/v1/mdm/mappings/${editingMapping.id}`, editingMapping);
             } else {
               const payload = { ...editingMapping, useYn: editingMapping.useYn || 'Y' };
               await apiClient.post('/api/v1/mdm/mappings', payload);
             }
             showAlert({ title: t('common.save_complete'), message: t('master.common.save_success', '성공적으로 저장되었습니다.') });
             setEditingMapping(null);
             fetchData();
        } catch (error: unknown) {
             const message = error instanceof Error ? error.message : String(error);
             showAlert({ title: t('common.save_failed'), message: t('common.save_failed_msg') + message });
        }
    };

    const handleDelete = (row: MappingData) => {
        if (!row.id) return;
        showConfirm({
            title: t('common.delete'),
            message: t('sales.client.messages.delete_confirm', { name: `${row.userName} 맵핑` }),
            confirmText: t('common.delete'),
            onConfirm: async () => {
                try {
                    await apiClient.delete(`/api/v1/mdm/mappings/${row.id}`);
                    showAlert({ title: t('common.delete_complete'), message: t('master.common.delete_success', '성공적으로 삭제되었습니다.') });
                    fetchData();
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : String(error);
                    showAlert({ title: t('common.delete_failed'), message: t('common.delete_failed_msg') + message });
                }
            }
        });
    };

    const columns: Column<MappingData>[] = [
        { header: t('master.mapping.corp', '법인명'), accessor: 'corporationName' },
        { header: t('master.mapping.branch', '지점명'), accessor: 'branchName' },
        { header: t('master.mapping.user', '사용자 ID / 명칭'), accessor: 'userName' },
        { header: t('master.mapping.warehouse', '담당 창고'), accessor: 'warehouseName' },
        {
            header: t('master.mapping.use_yn', '사용 여부'),
            accessor: (row) => (
                <span className={`mapping-use-badge ${row.useYn}`}>
                    {row.useYn === 'Y' ? t('code.status.use', '사용') : t('code.status.unused', '미사용')}
                </span>
            ),
            colWidth: '120px',
            align: 'center'
        },
        {
            header: t('master.common.actions', '관리'),
            accessor: (row) => (
                <div className="mapping-action-cell">
                    <button className="pagination-btn" title={t('common.edit')} onClick={() => setEditingMapping(row)}>
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
        <button className="btn btn-primary" onClick={() => setEditingMapping({ 
            useYn: 'Y', 
            corporationId: corporations[0]?.id,
            branchId: branches.find(b => b.corporationId === corporations[0]?.id)?.id || branches[0]?.id,
            warehouseId: warehouses.find(w => w.corporationId === corporations[0]?.id)?.id || warehouses[0]?.id,
            userId: users[0]?.id || ''
        })}>
            <Plus size={18} /> {t('master.common.add_btn', '신규 등록')}
        </button>
    );

    // Dynamic filtering for the edit modal dropdowns
    const filteredBranches = branches.filter(b => b.corporationId === editingMapping?.corporationId);
    const filteredWarehouses = warehouses.filter(w => w.corporationId === editingMapping?.corporationId);

    return (
        <div className="template-page fade-in mapping-mgmt-page">
            <PageHeader
                title={t('master.mapping.title', '법인-지점-사용자-창고 맵핑 관리')}
                description={t('master.mapping.desc', '법인, 지점, 사용자 및 담당 창고 간의 관계 권한을 설정하고 조회합니다.')}
                breadcrumbs={[t('sidebar.master_management', '기준정보 관리'), t('sidebar.mapping_management', '맵핑 관리')]}
                actions={headerActions}
            />

            <Modal 
                isOpen={editingMapping !== null} 
                onClose={() => setEditingMapping(null)}
                title={editingMapping?.id ? t('common.edit', '수정') : t('master.common.add_btn', '신규 등록')}
                footer={
                    <div className="form-actions-end">
                        <button className="btn btn-outline" onClick={() => setEditingMapping(null)}>{t('common.cancel', '취소')}</button>
                        <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {t('common.save', '저장')}</button>
                    </div>
                }
            >
                {editingMapping && (
                    <div className="mapping-editor-grid">
                        <SelectField
                            label={t('master.mapping.corp', '법인명') + ' *'}
                            value={editingMapping.corporationId?.toString() || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                const corpId = parseInt(e.target.value);
                                // Pre-fill branch and warehouse matching the selected corp
                                const matchedBr = branches.find(b => b.corporationId === corpId);
                                const matchedWh = warehouses.find(w => w.corporationId === corpId);
                                setEditingMapping({
                                    ...editingMapping,
                                    corporationId: corpId,
                                    branchId: matchedBr ? matchedBr.id : 0,
                                    warehouseId: matchedWh ? matchedWh.id : 0
                                });
                            }}
                            options={[
                                { value: '', label: t('common.select', '선택하세요') },
                                ...corporations.map(c => ({ value: c.id.toString(), label: c.name }))
                            ]}
                        />
                        <SelectField
                            label={t('master.mapping.branch', '지점명') + ' *'}
                            value={editingMapping.branchId?.toString() || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingMapping({...editingMapping, branchId: parseInt(e.target.value)})}
                            options={[
                                { value: '', label: t('common.select', '선택하세요') },
                                ...filteredBranches.map(b => ({ value: b.id.toString(), label: b.name }))
                            ]}
                            disabled={!editingMapping.corporationId}
                        />
                        <SelectField
                            label={t('master.mapping.user', '사용자') + ' *'}
                            value={editingMapping.userId || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingMapping({...editingMapping, userId: e.target.value})}
                            options={[
                                { value: '', label: t('common.select', '선택하세요') },
                                ...users.map(u => ({ value: u.id, label: `${u.name} (${u.id})` }))
                            ]}
                        />
                        <SelectField
                            label={t('master.mapping.warehouse', '담당 창고') + ' *'}
                            value={editingMapping.warehouseId?.toString() || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingMapping({...editingMapping, warehouseId: parseInt(e.target.value)})}
                            options={[
                                { value: '', label: t('common.select', '선택하세요') },
                                ...filteredWarehouses.map(w => ({ value: w.id.toString(), label: w.name }))
                            ]}
                            disabled={!editingMapping.corporationId}
                        />
                        <SelectField
                            label={t('master.mapping.use_yn', '사용 여부')}
                            value={editingMapping.useYn || 'Y'}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingMapping({...editingMapping, useYn: e.target.value as 'Y' | 'N'})}
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
                           label={t('master.mapping.filter_user', '사용자 ID')} 
                           value={searchUserId} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchUserId(e.target.value)} 
                           placeholder="사용자 ID 입력..." 
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
                    <div className="mapping-table-header">
                        <h3 className="section-title">
                            {t('master.mapping.list_title', '맵핑 관계 목록')} (<span className="accent-text">{mappings.length}</span>)
                        </h3>
                    </div>
                    {loading ? (
                        <div className="mapping-msg-loading">{t('sales.common.loading', '데이터 로딩 중...')}</div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={mappings}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default MappingManagement;
