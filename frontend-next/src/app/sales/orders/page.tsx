'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { DataTable, Column } from '../../../components/common/DataTable';
import { InputField, SelectField, DateRangePicker } from '../../../components/common/FormFields';
import { Modal } from '../../../components/common/Modal';
import { Search, Plus, Save, Edit2, Trash2 } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import { useModal } from '../../../contexts/ModalContext';
import './OrderManagement.css';

interface OrderData {
  id?: number;
  orderNumber: string;
  clientId: number;
  clientName?: string; // For display
  orderDate: string;
  deliveryDate: string;
  destination: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
}

interface ClientOption {
    id: number;
    clientName: string;
}

interface CommonCodeDetail {
    detailCode: string;
    detailName: string;
}

const OrderManagement: React.FC = () => {
    const { t } = useTranslation();
    const { showAlert, showConfirm } = useModal();
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [statusCodes, setStatusCodes] = useState<CommonCodeDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingOrder, setEditingOrder] = useState<Partial<OrderData> | null>(null);

    // Filters
    const [searchOrderNum, setSearchOrderNum] = useState('');
    const [searchStatus, setSearchStatus] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const fetchDropdownData = async () => {
        try {
            const [clientData, codeData] = await Promise.all([
                apiClient.get<ClientOption[]>('/api/v1/sales/clients'),
                apiClient.get<CommonCodeDetail[]>('/api/v1/system/codes/LOG-001/details')
            ]);
            setClients(clientData);
            setStatusCodes(codeData);
        } catch(error) {
            console.warn("Failed to fetch dropdown data", error);
        }
    }

    const fetchOrders = async () => {
        setLoading(true);
        try {
            let url = '/api/v1/sales/orders?';
            if (searchOrderNum) url += `orderNumber=${encodeURIComponent(searchOrderNum)}&`;
            if (searchStatus) url += `status=${encodeURIComponent(searchStatus)}&`;
            if (startDate) {
                const startStr = startDate.toISOString().split('T')[0];
                url += `startDate=${encodeURIComponent(startStr)}&`;
            }
            if (endDate) {
                const endStr = endDate.toISOString().split('T')[0];
                url += `endDate=${encodeURIComponent(endStr)}&`;
            }
            
            const data = await apiClient.get<OrderData[]>(url);
            setOrders(data);
        } catch (error) {
            console.warn("Error fetching orders:", error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDropdownData();
        fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = () => {
        fetchOrders();
    };

    const handleSave = async () => {
        if (!editingOrder?.clientId || !editingOrder?.destination || !editingOrder?.orderDate) {
            showAlert({ 
                title: t('common.input_error'), 
                message: 'msg.input_required' 
            });
            return;
        }

        try {
             if (editingOrder.id) {
               await apiClient.put(`/api/v1/sales/orders/${editingOrder.id}`, editingOrder);
               showAlert({ title: t('common.save_complete'), message: 'msg.save_success' });
             } else {
               const payload = { ...editingOrder, status: editingOrder.status || 'pending' };
               await apiClient.post('/api/v1/sales/orders', payload);
               showAlert({ title: t('common.save_complete'), message: 'msg.save_success' });
             }
             setEditingOrder(null);
             fetchOrders();
        } catch (error: unknown) {
            console.warn("Save error:", error);
            showAlert({ title: t('common.save_failed'), message: 'msg.error_occurred' });
        }
    };

    const handleDelete = (row: OrderData) => {
        if (!row.id) return;
        showConfirm({
            title: t('common.delete'),
            message: 'msg.delete_confirm',
            confirmText: t('common.delete'),
            onConfirm: async () => {
                try {
                    await apiClient.delete(`/api/v1/sales/orders/${row.id}`);
                    showAlert({ title: t('common.delete_complete'), message: 'msg.delete_success' });
                    fetchOrders();
                } catch (error: unknown) {
                    console.warn("Delete error:", error);
                    showAlert({ title: t('common.delete_failed'), message: 'msg.error_occurred' });
                }
            }
        });
    };

    const columns: Column<OrderData>[] = [
        { header: t('sales.order.fields.order_no'), accessor: 'orderNumber', colWidth: '130px' },
        { header: t('sales.order.fields.order_date'), accessor: 'orderDate', colWidth: '120px' },
        { header: t('sales.order.fields.client'), accessor: 'clientName' },
        { header: t('sales.order.fields.destination'), accessor: 'destination' },
        { header: t('sales.order.fields.delivery_date'), accessor: 'deliveryDate', colWidth: '120px' },
        { 
            header: t('sales.order.fields.amount'), 
            accessor: (row) => row.totalAmount ? row.totalAmount.toLocaleString() : '-', 
            align: 'right', 
            colWidth: '180px' 
        },
        {
            header: t('sales.order.fields.status'),
            accessor: (row) => {
                const statusInfo = statusCodes.find(c => c.detailCode === row.status);
                return (
                    <span className={`order-status-badge ${row.status}`}>
                        {statusInfo ? statusInfo.detailName : row.status}
                    </span>
                );
            },
            colWidth: '110px',
            align: 'center'
        },
        {
            header: t('sales.common.actions'),
            accessor: (row) => (
                <div className="order-action-cell">
                    <button className="pagination-btn" title={t('common.edit')} onClick={() => setEditingOrder(row)}>
                        <Edit2 size={16} />
                    </button>
                    <button className="pagination-btn" title={t('common.delete')} onClick={() => handleDelete(row)}>
                        <Trash2 size={16} color="var(--status-danger)" />
                    </button>
                </div>
            ),
            colWidth: '100px',
            align: 'center'
        }
    ];

    const headerActions = (
        <button className="btn btn-primary" onClick={() => setEditingOrder({ status: 'pending', totalAmount: 0 })}>
            <Plus size={18} /> {t('sales.order.add_btn')}
        </button>
    );

    return (
        <div className="template-page fade-in order-mgmt-page">
            <PageHeader
                title={t('sales.order.title')}
                description={t('sales.order.desc')}
                breadcrumbs={[t('sidebar.sales_management'), t('sidebar.order_management')]}
                actions={headerActions}
            />

            <div className="flex flex-col gap-24">
            <Modal 
                isOpen={editingOrder !== null} 
                onClose={() => setEditingOrder(null)}
                title={editingOrder?.id ? t('sales.order.edit_title') : t('sales.order.new_title')}
                size="lg"
                footer={
                    <div className="form-actions-end">
                        <button className="btn btn-outline" onClick={() => setEditingOrder(null)}>{t('common.cancel')}</button>
                        <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {t('common.save')}</button>
                    </div>
                }
            >
                {editingOrder && (
                    <div className="order-editor-grid">
                        {editingOrder.id && (
                             <InputField 
                                label={t('sales.order.fields.order_no')} 
                                value={editingOrder.orderNumber || ''} 
                                readOnly
                                disabled
                                className="bg-tertiary"
                             />
                        )}
                        <SelectField
                            label={t('sales.order.fields.client') + ' *'}
                            value={editingOrder.clientId?.toString() || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingOrder({...editingOrder, clientId: parseInt(e.target.value)})}
                            options={[
                                { value: '', label: t('common.select') },
                                ...clients.map(c => ({ value: c.id.toString(), label: c.clientName }))
                            ]}
                        />
                        <InputField 
                           label={t('sales.order.fields.order_date') + ' *'} 
                           type="date"
                           value={editingOrder.orderDate || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingOrder({...editingOrder, orderDate: e.target.value})} 
                        />
                         <InputField 
                           label={t('sales.order.fields.delivery_date')} 
                           type="date"
                           value={editingOrder.deliveryDate || ''} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingOrder({...editingOrder, deliveryDate: e.target.value})} 
                        />
                        <div className="grid-item-full">
                            <InputField 
                                label={t('sales.order.fields.destination') + ' *'} 
                                value={editingOrder.destination || ''} 
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingOrder({...editingOrder, destination: e.target.value})} 
                                placeholder={t('sales.order.destination_placeholder')} 
                            />
                        </div>
                        <InputField 
                           label={t('sales.order.fields.amount')} 
                           type="number"
                           value={editingOrder.totalAmount?.toString() || '0'} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingOrder({...editingOrder, totalAmount: parseInt(e.target.value) || 0})} 
                        />
                        <SelectField
                            label={t('sales.order.fields.status') + ' *'}
                            value={editingOrder.status || 'pending'}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingOrder({...editingOrder, status: e.target.value as OrderData['status']})}
                            options={[
                                ...statusCodes.map(c => ({ value: c.detailCode, label: c.detailName }))
                            ]}
                        />
                    </div>
                )}
            </Modal>
    
                <Card title={t('sales.order.filter_title')} collapsible>
                    <div className="filter-panel horizontal grid-5">
                        <InputField 
                           label={t('sales.order.fields.order_no')} 
                           value={searchOrderNum} 
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchOrderNum(e.target.value)} 
                           placeholder={t('sales.order.search_placeholder')} 
                           fullWidth={false}
                        />
                        <SelectField
                            label={t('sales.order.fields.status')}
                            options={[
                                { value: '', label: t('common.all') },
                                ...statusCodes.map(c => ({ value: c.detailCode, label: c.detailName }))
                            ]}
                             value={searchStatus}
                             onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSearchStatus(e.target.value)}
                             fullWidth={false}
                        />
                        <DateRangePicker 
                           label={t('sales.order.fields.order_date')} 
                           startDate={startDate}
                           endDate={endDate}
                           onChange={(start, end) => {
                             setStartDate(start);
                             setEndDate(end);
                           }}
                           className="grid-span-2"
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
                    <div className="order-table-header">
                        <h3 className="section-title">
                            {t('sales.order.list_title')} (<span className="accent-text">{orders.length}</span>)
                        </h3>
                    </div>
                    {loading ? (
                        <div className="order-msg-loading">{t('sales.common.loading')}</div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={orders}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default OrderManagement;
