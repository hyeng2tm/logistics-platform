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
import './Warehouse.css';

interface CorporationData {
  id: number;
  code: string;
  name: string;
}

interface WarehouseData {
  id?: number;
  code: string;
  name: string;
  corporationId: number;
  corporationName?: string; // Client-side mapped
  type: string; // DRY, CHILLED, FROZEN, HAZARDOUS or 상온, 냉장, 냉동
  address: string;
  useYn: 'Y' | 'N';
}

interface CodeDetail {
  code: string;
  label: string;
  translations: Record<string, string>;
}

const WarehouseManagement: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { showAlert, showConfirm } = useModal();
    const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
    const [corporations, setCorporations] = useState<CorporationData[]>([]);
    const [warehouseTypes, setWarehouseTypes] = useState<CodeDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingWarehouse, setEditingWarehouse] = useState<Partial<WarehouseData> | null>(null);
    const [searchName, setSearchName] = useState('');

    const getDisplayLabel = (typeCode: string) => {
        const matched = warehouseTypes.find(item => item.code === typeCode);
        if (!matched) return typeCode;
        const lang = i18n.resolvedLanguage || i18n.language || 'ko';
        const baseLang = lang.split('-')[0];
        return (matched.translations && matched.translations[baseLang]) || matched.label;
    };

    const fetchData = async (nameKeyword?: string) => {
        setLoading(true);
        try {
            // Fetch dependencies
            const [corpsData, typeCodes] = await Promise.all([
                apiClient.get<CorporationData[]>('/api/v1/mdm/corporations'),
                apiClient.get<CodeDetail[]>('/api/v1/system/codes/detail/WH_TYPE').catch(err => {
                    console.warn("Error fetching warehouse types:", err);
                    return [] as CodeDetail[];
                })
            ]);

            setCorporations(corpsData);
            setWarehouseTypes(typeCodes);

            // Fetch warehouses
            const url = nameKeyword ? `/api/v1/mdm/warehouses?name=${encodeURIComponent(nameKeyword)}` : '/api/v1/mdm/warehouses';
            const warehousesData = await apiClient.get<WarehouseData[]>(url);
            
            // Map corp names
            const mappedWarehouses = warehousesData.map(w => ({
                ...w,
                corporationName: corpsData.find(c => c.id === w.corporationId)?.name || `ID: ${w.corporationId}`
            }));
            setWarehouses(mappedWarehouses);
        } catch (error) {
            console.warn("Error fetching warehouse data:", error);
            setWarehouses([]);
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
        if (!editingWarehouse?.code || !editingWarehouse?.name || !editingWarehouse?.corporationId || !editingWarehouse?.type) {
            showAlert({ 
                title: t('common.input_error'), 
                message: t('sales.client.messages.required', '필수 입력 필드가 누락되었습니다.') 
            });
            return;
        }

        try {
             if (editingWarehouse.id) {
               await apiClient.put(`/api/v1/mdm/warehouses/${editingWarehouse.id}`, editingWarehouse);
             } else {
               const payload = { ...editingWarehouse, useYn: editingWarehouse.useYn || 'Y' };
               await apiClient.post('/api/v1/mdm/warehouses', payload);
             }
             showAlert({ title: t('common.save_complete'), message: t('master.common.save_success', '성공적으로 저장되었습니다.') });
             setEditingWarehouse(null);
             fetchData();
        } catch (error: unknown) {
             const message = error instanceof Error ? error.message : String(error);
             showAlert({ title: t('common.save_failed'), message: t('common.save_failed_msg') + message });
        }
    };

    const handleDelete = (row: WarehouseData) => {
        if (!row.id) return;
        showConfirm({
            title: t('common.delete'),
            message: t('sales.client.messages.delete_confirm', { name: row.name }),
            confirmText: t('common.delete'),
            onConfirm: async () => {
                try {
                    await apiClient.delete(`/api/v1/mdm/warehouses/${row.id}`);
                    showAlert({ title: t('common.delete_complete'), message: t('master.common.delete_success', '성공적으로 삭제되었습니다.') });
                    fetchData();
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : String(error);
                    showAlert({ title: t('common.delete_failed'), message: t('common.delete_failed_msg') + message });
                }
            }
        });
    };

    const columns: Column<WarehouseData>[] = [
        { header: t('master.warehouse.code', '창고 코드'), accessor: 'code', colWidth: '120px' },
        { header: t('master.warehouse.name', '창고명'), accessor: 'name' },
        { header: t('master.warehouse.corp', '소속 법인'), accessor: 'corporationName', colWidth: '150px' },
        { header: t('master.warehouse.type', '창고 타입'), accessor: (row) => getDisplayLabel(row.type), colWidth: '150px' },
        { header: t('master.warehouse.address', '창고 주소'), accessor: 'address' },
        {
            header: t('master.warehouse.use_yn', '사용 여부'),
            accessor: (row) => (
                <span className={`warehouse-use-badge ${row.useYn}`}>
                    {row.useYn === 'Y' ? t('code.status.use', '사용') : t('code.status.unused', '미사용')}
                </span>
            ),
            colWidth: '120px',
            align: 'center'
        },
        {
            header: t('master.common.actions', '관리'),
            accessor: (row) => (
                <div className="warehouse-action-cell">
                    <button className="pagination-btn" title={t('common.edit')} onClick={() => setEditingWarehouse(row)}>
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
        <button className="btn btn-primary" onClick={() => setEditingWarehouse({ 
            useYn: 'Y', 
            type: warehouseTypes[0]?.code || 'DRY', 
            corporationId: corporations[0]?.id 
        })}>
            <Plus size={18} /> {t('master.common.add_btn', '신규 등록')}
        </button>
    );

    return (
        <div className="template-page fade-in warehouse-mgmt-page">
            <PageHeader
                title={t('master.warehouse.title', '창고 정보 관리')}
                description={t('master.warehouse.desc', '법인 산하에서 운영하는 물류 창고 및 적재 거점 정보를 관리합니다.')}
                breadcrumbs={[t('sidebar.master_management', '기준정보 관리'), t('sidebar.warehouse_management', '창고 정보 관리')]}
                actions={headerActions}
            />

            <Modal 
                isOpen={editingWarehouse !== null} 
                onClose={() => setEditingWarehouse(null)}
                title={editingWarehouse?.id ? t('common.edit', '수정') : t('master.common.add_btn', '신규 등록')}
                footer={
                    <div className="form-actions-end">
                        <button className="btn btn-outline" onClick={() => setEditingWarehouse(null)}>{t('common.cancel', '취소')}</button>
                        <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {t('common.save', '저장')}</button>
                    </div>
                }
            >
                {editingWarehouse && (
                    <div className="warehouse-editor-grid">
                        <InputField 
                           label={t('master.warehouse.code', '창고 코드') + ' *'} 
                           value={editingWarehouse.code || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingWarehouse({...editingWarehouse, code: e.target.value})} 
                           placeholder="e.g. WH001" 
                        />
                        <InputField 
                           label={t('master.warehouse.name', '창고명') + ' *'} 
                           value={editingWarehouse.name || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingWarehouse({...editingWarehouse, name: e.target.value})} 
                           placeholder="e.g. 서울 메가 센터" 
                        />
                        <SelectField
                            label={t('master.warehouse.corp', '소속 법인') + ' *'}
                            value={editingWarehouse.corporationId?.toString() || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingWarehouse({...editingWarehouse, corporationId: parseInt(e.target.value)})}
                            options={[
                                { value: '', label: t('common.select', '선택하세요') },
                                ...corporations.map(c => ({ value: c.id.toString(), label: c.name }))
                            ]}
                        />
                        <SelectField
                            label={t('master.warehouse.type', '창고 타입') + ' *'}
                            value={editingWarehouse.type || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingWarehouse({...editingWarehouse, type: e.target.value})}
                            options={[
                                { value: '', label: t('common.select', '선택하세요') },
                                ...(warehouseTypes.length > 0 
                                    ? warehouseTypes.map(item => ({
                                        value: item.code,
                                        label: (item.translations && item.translations[i18n.resolvedLanguage || i18n.language || 'ko']) || item.label
                                      }))
                                    : [
                                        { value: '상온', label: '상온' },
                                        { value: '냉장', label: '냉장' },
                                        { value: '냉동', label: '냉동' },
                                        { value: '위험물', label: '위험물' }
                                      ]
                                )
                            ]}
                        />
                        <InputField 
                           label={t('master.warehouse.address', '창고 주소')} 
                           value={editingWarehouse.address || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingWarehouse({...editingWarehouse, address: e.target.value})} 
                           placeholder="인천광역시 중구..." 
                        />
                        <SelectField
                            label={t('master.warehouse.use_yn', '사용 여부')}
                            value={editingWarehouse.useYn || 'Y'}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingWarehouse({...editingWarehouse, useYn: e.target.value as 'Y' | 'N'})}
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
                           label={t('master.warehouse.name', '창고명')} 
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
                    <div className="warehouse-table-header">
                        <h3 className="section-title">
                            {t('master.warehouse.list_title', '창고 목록')} (<span className="accent-text">{warehouses.length}</span>)
                        </h3>
                    </div>
                    {loading ? (
                        <div className="warehouse-msg-loading">{t('sales.common.loading', '데이터 로딩 중...')}</div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={warehouses}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default WarehouseManagement;
