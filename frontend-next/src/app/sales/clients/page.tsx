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
import './ClientManagement.css';

interface ClientData {
  id?: number;
  clientCode: string;
  clientName: string;
  businessNumber: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  status: 'active' | 'inactive';
}

const ClientManagement: React.FC = () => {
    const { t } = useTranslation();
    const { showAlert, showConfirm } = useModal();
    const [clients, setClients] = useState<ClientData[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingClient, setEditingClient] = useState<Partial<ClientData> | null>(null);
    const [searchName, setSearchName] = useState('');
    const [searchStatus, setSearchStatus] = useState('');

    const fetchClients = async (nameKeyword?: string) => {
        setLoading(true);
        try {
            const url = nameKeyword ? `/api/v1/sales/clients?name=${encodeURIComponent(nameKeyword)}` : '/api/v1/sales/clients';
            const data = await apiClient.get<ClientData[]>(url);
            setClients(data);
        } catch (error) {
            console.warn("Error fetching clients:", error);
            setClients([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleSearch = () => {
        fetchClients(searchName);
    };

    const handleSave = async () => {
        if (!editingClient?.clientCode || !editingClient?.clientName) {
            showAlert({ 
                title: t('common.input_error'), 
                message: t('sales.client.messages.required') 
            });
            return;
        }

        try {
             if (editingClient.id) {
               await apiClient.put(`/api/v1/sales/clients/${editingClient.id}`, editingClient);
               showAlert({ title: t('common.save_complete'), message: t('common.save_complete') });
             } else {
               const payload = { ...editingClient, status: editingClient.status || 'active' };
               await apiClient.post('/api/v1/sales/clients', payload);
               showAlert({ title: t('common.save_complete'), message: t('common.save_complete') });
             }
             setEditingClient(null);
             fetchClients();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            showAlert({ title: t('common.save_failed'), message: t('common.save_failed_msg') + message });
        }
    };

    const handleDelete = (row: ClientData) => {
        if (!row.id) return;
        showConfirm({
            title: t('common.delete'),
            message: t('sales.client.messages.delete_confirm', { name: row.clientName }),
            confirmText: t('common.delete'),
            onConfirm: async () => {
                try {
                    await apiClient.delete(`/api/v1/sales/clients/${row.id}`);
                    showAlert({ title: t('common.delete_complete'), message: t('common.delete_complete') });
                    fetchClients();
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : String(error);
                    showAlert({ title: t('common.delete_failed'), message: t('common.delete_failed_msg') + message });
                }
            }
        });
    };

    const columns: Column<ClientData>[] = [
        { header: t('sales.client.fields.code'), accessor: 'clientCode', colWidth: '120px' },
        { header: t('sales.client.fields.name'), accessor: 'clientName' },
        { header: t('sales.client.fields.biz_no'), accessor: 'businessNumber', colWidth: '150px' },
        { header: t('sales.client.fields.manager'), accessor: 'managerName', colWidth: '120px' },
        { header: t('sales.client.fields.phone'), accessor: 'managerPhone', colWidth: '150px' },
        {
            header: t('sales.client.fields.status'),
            accessor: (row) => (
                <span className={`client-status-badge ${row.status}`}>
                    {row.status === 'active' ? t('sales.client.status_active') : t('sales.client.status_inactive')}
                </span>
            ),
            colWidth: '120px',
            align: 'center'
        },
        {
            header: t('sales.common.actions'),
            accessor: (row) => (
                <div className="client-action-cell">
                    <button className="pagination-btn" title={t('common.edit')} onClick={() => setEditingClient(row)}>
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
        <button className="btn btn-primary" onClick={() => setEditingClient({ status: 'active' })}>
            <Plus size={18} /> {t('sales.client.add_btn')}
        </button>
    );

    return (
        <div className="template-page fade-in client-mgmt-page">
            <PageHeader
                title={t('sales.client.title')}
                description={t('sales.client.desc')}
                breadcrumbs={[t('sidebar.sales_management'), t('sidebar.client_management')]}
                actions={headerActions}
            />

            <Modal 
                isOpen={editingClient !== null} 
                onClose={() => setEditingClient(null)}
                title={editingClient?.id ? t('sales.client.edit_title') : t('sales.client.new_title')}
                footer={
                    <div className="form-actions-end">
                        <button className="btn btn-outline" onClick={() => setEditingClient(null)}>{t('common.cancel')}</button>
                        <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {t('common.save')}</button>
                    </div>
                }
            >
                {editingClient && (
                    <div className="client-editor-grid">
                        <InputField 
                           label={t('sales.client.fields.code') + ' *'} 
                           value={editingClient.clientCode || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingClient({...editingClient, clientCode: e.target.value})} 
                           placeholder={t('sales.client.code_placeholder')} 
                        />
                        <InputField 
                           label={t('sales.client.fields.name') + ' *'} 
                           value={editingClient.clientName || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingClient({...editingClient, clientName: e.target.value})} 
                           placeholder={t('sales.client.name_placeholder')} 
                        />
                        <InputField 
                           label={t('sales.client.fields.biz_no')} 
                           value={editingClient.businessNumber || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingClient({...editingClient, businessNumber: e.target.value})} 
                           placeholder={t('sales.client.biz_no_placeholder')} 
                        />
                        <InputField 
                           label={t('sales.client.fields.manager')} 
                           value={editingClient.managerName || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingClient({...editingClient, managerName: e.target.value})} 
                           placeholder={t('sales.client.manager_placeholder')} 
                        />
                        <InputField 
                           label={t('sales.client.fields.phone')} 
                           value={editingClient.managerPhone || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingClient({...editingClient, managerPhone: e.target.value})} 
                           placeholder={t('sales.client.phone_placeholder')} 
                        />
                        <InputField 
                           label={t('sales.client.fields.email')} 
                           value={editingClient.managerEmail || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingClient({...editingClient, managerEmail: e.target.value})} 
                           placeholder={t('sales.client.email_placeholder')} 
                        />
                        <SelectField
                            label={t('sales.client.fields.status')}
                            value={editingClient.status || 'active'}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingClient({...editingClient, status: e.target.value as 'active' | 'inactive'})}
                            options={[
                                { value: 'active', label: t('sales.client.status_active') },
                                { value: 'inactive', label: t('sales.client.status_inactive') }
                            ]}
                        />
                    </div>
                )}
            </Modal>

            <div className="flex flex-col gap-24">
                <Card title={t('sales.client.filter_title')} collapsible>
                    <div className="filter-panel horizontal grid-5">
                        <InputField 
                           label={t('sales.client.fields.name')} 
                           value={searchName} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchName(e.target.value)} 
                           placeholder={t('sales.client.search_placeholder')} 
                           fullWidth={false}
                        />
                        <SelectField
                            label={t('sales.client.fields.status')}
                            value={searchStatus}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSearchStatus(e.target.value)}
                            options={[
                                { value: '', label: t('common.all') },
                                { value: 'active', label: t('sales.client.status_active') },
                                { value: 'inactive', label: t('sales.client.status_inactive') }
                            ]}
                            fullWidth={false}
                        />
                        <div className="filter-actions">
                            <button className="btn btn-primary" onClick={handleSearch}>
                                 <Search size={18} />
                                 {t('common.search')}
                            </button>
                        </div>
                    </div>
                </Card>

                <Card noPadding>
                    <div className="client-table-header">
                        <h3 className="section-title">
                            {t('sales.client.list_title')} (<span className="accent-text">{clients.length}</span>)
                        </h3>
                    </div>
                    {loading ? (
                        <div className="client-msg-loading">{t('sales.common.loading')}</div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={clients}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default ClientManagement;
