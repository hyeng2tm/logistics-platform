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
import './Customer.css';

interface CustomerData {
  id?: number;
  code: string;
  name: string;
  businessNumber: string;
  contact: string;
  address: string;
  useYn: 'Y' | 'N';
}

const CustomerManagement: React.FC = () => {
    const { t } = useTranslation();
    const { showAlert, showConfirm } = useModal();
    const [customers, setCustomers] = useState<CustomerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCustomer, setEditingCustomer] = useState<Partial<CustomerData> | null>(null);
    const [searchName, setSearchName] = useState('');

    const fetchCustomers = async (nameKeyword?: string) => {
        setLoading(true);
        try {
            const url = nameKeyword ? `/api/v1/mdm/customers?name=${encodeURIComponent(nameKeyword)}` : '/api/v1/mdm/customers';
            const data = await apiClient.get<CustomerData[]>(url);
            setCustomers(data);
        } catch (error) {
            console.warn("Error fetching customers:", error);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleSearch = () => {
        fetchCustomers(searchName);
    };

    const handleSave = async () => {
        if (!editingCustomer?.code || !editingCustomer?.name) {
            showAlert({ 
                title: t('common.input_error'), 
                message: t('sales.client.messages.required', '필수 입력 필드가 누락되었습니다.') 
            });
            return;
        }

        try {
             if (editingCustomer.id) {
               await apiClient.put(`/api/v1/mdm/customers/${editingCustomer.id}`, editingCustomer);
             } else {
               const payload = { ...editingCustomer, useYn: editingCustomer.useYn || 'Y' };
               await apiClient.post('/api/v1/mdm/customers', payload);
             }
             showAlert({ title: t('common.save_complete'), message: t('master.common.save_success', '성공적으로 저장되었습니다.') });
             setEditingCustomer(null);
             fetchCustomers();
        } catch (error: unknown) {
             const message = error instanceof Error ? error.message : String(error);
             showAlert({ title: t('common.save_failed'), message: t('common.save_failed_msg') + message });
        }
    };

    const handleDelete = (row: CustomerData) => {
        if (!row.id) return;
        showConfirm({
            title: t('common.delete'),
            message: t('sales.client.messages.delete_confirm', { name: row.name }),
            confirmText: t('common.delete'),
            onConfirm: async () => {
                try {
                    await apiClient.delete(`/api/v1/mdm/customers/${row.id}`);
                    showAlert({ title: t('common.delete_complete'), message: t('master.common.delete_success', '성공적으로 삭제되었습니다.') });
                    fetchCustomers();
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : String(error);
                    showAlert({ title: t('common.delete_failed'), message: t('common.delete_failed_msg') + message });
                }
            }
        });
    };

    const columns: Column<CustomerData>[] = [
        { header: t('master.customer.code', '고객사 코드'), accessor: 'code', colWidth: '120px' },
        { header: t('master.customer.name', '고객사명'), accessor: 'name' },
        { header: t('master.customer.biz_no', '사업자번호'), accessor: 'businessNumber', colWidth: '150px' },
        { header: t('master.customer.contact', '연락처'), accessor: 'contact', colWidth: '150px' },
        { header: t('master.customer.address', '주소'), accessor: 'address' },
        {
            header: t('master.customer.use_yn', '사용 여부'),
            accessor: (row) => (
                <span className={`customer-use-badge ${row.useYn}`}>
                    {row.useYn === 'Y' ? t('code.status.use', '사용') : t('code.status.unused', '미사용')}
                </span>
            ),
            colWidth: '120px',
            align: 'center'
        },
        {
            header: t('master.common.actions', '관리'),
            accessor: (row) => (
                <div className="customer-action-cell">
                    <button className="pagination-btn" title={t('common.edit')} onClick={() => setEditingCustomer(row)}>
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
        <button className="btn btn-primary" onClick={() => setEditingCustomer({ useYn: 'Y' })}>
            <Plus size={18} /> {t('master.common.add_btn', '신규 등록')}
        </button>
    );

    return (
        <div className="template-page fade-in customer-mgmt-page">
            <PageHeader
                title={t('master.customer.title', '고객 관리')}
                description={t('master.customer.desc', '물류 서비스를 의뢰하는 고객사(화주)의 마스터 정보를 관리합니다.')}
                breadcrumbs={[t('sidebar.master_management', '기준정보 관리'), t('sidebar.customer_management', '고객 관리')]}
                actions={headerActions}
            />

            <Modal 
                isOpen={editingCustomer !== null} 
                onClose={() => setEditingCustomer(null)}
                title={editingCustomer?.id ? t('common.edit', '수정') : t('master.common.add_btn', '신규 등록')}
                footer={
                    <div className="form-actions-end">
                        <button className="btn btn-outline" onClick={() => setEditingCustomer(null)}>{t('common.cancel', '취소')}</button>
                        <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {t('common.save', '저장')}</button>
                    </div>
                }
            >
                {editingCustomer && (
                    <div className="customer-editor-grid">
                        <InputField 
                           label={t('master.customer.code', '고객사 코드') + ' *'} 
                           value={editingCustomer.code || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCustomer({...editingCustomer, code: e.target.value})} 
                           placeholder="e.g. CUST001" 
                        />
                        <InputField 
                           label={t('master.customer.name', '고객사명') + ' *'} 
                           value={editingCustomer.name || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCustomer({...editingCustomer, name: e.target.value})} 
                           placeholder="e.g. (주)상공무역" 
                        />
                        <InputField 
                           label={t('master.customer.biz_no', '사업자번호')} 
                           value={editingCustomer.businessNumber || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCustomer({...editingCustomer, businessNumber: e.target.value})} 
                           placeholder="123-45-67890" 
                        />
                        <InputField 
                           label={t('master.customer.contact', '연락처')} 
                           value={editingCustomer.contact || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCustomer({...editingCustomer, contact: e.target.value})} 
                           placeholder="02-1234-5678" 
                        />
                        <InputField 
                           label={t('master.customer.address', '주소')} 
                           value={editingCustomer.address || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCustomer({...editingCustomer, address: e.target.value})} 
                           placeholder="서울특별시 마포구..." 
                        />
                        <SelectField
                            label={t('master.customer.use_yn', '사용 여부')}
                            value={editingCustomer.useYn || 'Y'}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingCustomer({...editingCustomer, useYn: e.target.value as 'Y' | 'N'})}
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
                           label={t('master.customer.filter_name', '고객사명')} 
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
                    <div className="customer-table-header">
                        <h3 className="section-title">
                            {t('master.customer.list_title', '고객사 목록')} (<span className="accent-text">{customers.length}</span>)
                        </h3>
                    </div>
                    {loading ? (
                        <div className="customer-msg-loading">{t('sales.common.loading', '데이터 로딩 중...')}</div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={customers}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default CustomerManagement;
