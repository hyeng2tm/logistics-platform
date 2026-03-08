import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { DataTable, Column } from '../../components/common/DataTable';
import { InputField, SelectField } from '../../components/common/FormFields';
import { Search, Save, PackagePlus } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import { Modal } from '../../components/common/Modal';
import { apiClient } from '../../utils/apiClient';

import { useRef } from 'react';
import './Inbound.css';

const ProgressBar: React.FC<{ percent: number }> = ({ percent }) => {
    const ref = useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (ref.current) {
            ref.current.style.setProperty('--progress-width', `${percent}%`);
        }
    }, [percent]);

    return (
        <div className="inbound-progress-bg">
            <div 
                ref={ref}
                className={`inbound-progress-bar ${percent === 100 ? 'completed' : ''}`}
            ></div>
        </div>
    );
};

interface InboundData {
  id: number;
  inboundNumber: string;
  clientName: string;
  expectedDate: string;
  itemName: string;
  sku: string;
  expectedQty: number;
  receivedQty: number;
  status: string;
}

interface CommonCodeDetail {
    detailCode: string;
    detailName: string;
}

const Inbound: React.FC = () => {
    const { t } = useTranslation();
    const { showAlert, showConfirm } = useModal();
    const [inboundList, setInboundList] = useState<InboundData[]>([]);
    const [statusCodes, setStatusCodes] = useState<CommonCodeDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingInbound, setEditingInbound] = useState<InboundData | null>(null);

    // Form inputs for receiving
    const [receiveInputQty, setReceiveInputQty] = useState<number>(0);
    const [receiveLocation, setReceiveLocation] = useState<string>('');

    const fetchInbound = async () => {
        setLoading(true);
        try {
            // In a real app, this would be an API call
            // For now, let's keep mock data but imagine it's from API
            setInboundList([
                { id: 1, inboundNumber: 'IN-20231024-001', clientName: 'A물산', expectedDate: '2023-10-24', itemName: '무선 키보드 K100', sku: 'SKU-A-001', expectedQty: 500, receivedQty: 0, status: 'expected' },
                { id: 2, inboundNumber: 'IN-20231024-002', clientName: 'B유통', expectedDate: '2023-10-24', itemName: '스마트 헤드셋 H20', sku: 'SKU-B-050', expectedQty: 200, receivedQty: 100, status: 'receiving' },
                { id: 3, inboundNumber: 'IN-20231020-005', clientName: 'C산업', expectedDate: '2023-10-20', itemName: '산업용 장갑 M', sku: 'SKU-C-999', expectedQty: 1000, receivedQty: 1000, status: 'completed' },
                { id: 4, inboundNumber: 'IN-20231022-001', clientName: 'D컴퍼니', expectedDate: '2023-10-22', itemName: '데스크탑 모니터 27"', sku: 'SKU-D-027', expectedQty: 50, receivedQty: 48, status: 'discrepancy' },
            ]);
        } catch (error) {
            console.error("Error fetching inbound:", error);
            setInboundList([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatusCodes = async () => {
        try {
            const data = await apiClient.get<CommonCodeDetail[]>('/api/v1/system/codes/INV-001/details');
            setStatusCodes(data);
        } catch (error) {
            console.error("Failed to fetch status codes", error);
        }
    }

    useEffect(() => {
        fetchInbound();
        fetchStatusCodes();
    }, []);

    const handleSelectForReceive = (row: InboundData) => {
        if (row.status === 'completed') {
            showAlert({ title: t('common.notifications'), message: 'msg.already_completed' });
            return;
        }
        setEditingInbound(row);
        setReceiveInputQty(row.expectedQty - row.receivedQty); // Default to remaining
        setReceiveLocation('');
    };

    const handleReceiveSubmit = async () => {
        if (!editingInbound) return;
        if (receiveInputQty <= 0) {
            showAlert({ title: t('common.input_error'), message: 'msg.invalid_quantity' });
            return;
        }
        if (!receiveLocation) {
            showAlert({ title: t('common.input_error'), message: 'msg.input_required' });
            return;
        }

        showConfirm({
            title: t('inventory.inbound.save_confirm_title'),
            message: 'msg.save_confirm',
            confirmText: t('inventory.inbound.btn_work'),
            onConfirm: async () => {
                try {
                    showAlert({ title: t('common.save_complete'), message: 'msg.save_success' });
                    
                    // Mock UI update
                    setInboundList(prev => prev.map(item => {
                        if (item.id === editingInbound.id) {
                            const newTotal = item.receivedQty + receiveInputQty;
                            return { ...item, receivedQty: newTotal, status: newTotal >= item.expectedQty ? 'completed' : 'receiving' };
                        }
                        return item;
                    }));
                    setEditingInbound(null);
                } catch (error: unknown) {
                    console.error("Receive error:", error);
                    showAlert({ title: t('common.save_failed'), message: 'msg.error_occurred' });
                }
            }
        });
    };

    const getStatusInfo = (status: string) => {
        const code = statusCodes.find(c => c.detailCode === status);
        const label = code ? code.detailName : status;
        
        switch(status) {
            case 'expected': return { class: 'status-expected', label, bg: '#F8FAFC', text: '#64748B' };
            case 'receiving': return { class: 'status-receiving', label, bg: '#E0F2FE', text: '#0284C7' };
            case 'completed': return { class: 'status-completed', label, bg: '#E6F9F4', text: '#05CD99' };
            case 'discrepancy': return { class: 'status-discrepancy', label, bg: '#FEE2E2', text: '#DC2626' };
            default: return { class: '', label, bg: '#F1F5F9', text: '#475569' };
        }
    };

    const columns: Column<InboundData>[] = [
        { header: t('inventory.inbound.asn_info'), accessor: 'inboundNumber', colWidth: '140px' },
        { header: t('inventory.common.client'), accessor: 'clientName', colWidth: '120px' },
        { header: t('inventory.common.expected_date'), accessor: 'expectedDate', colWidth: '110px' },
        { 
            header: `${t('inventory.common.item_name')} / ${t('inventory.common.sku')}`, 
            accessor: (row) => (
                <div className="inbound-info-cell">
                    <div className="inbound-item-name">{row.itemName}</div>
                    <div className="inbound-sku-name">{row.sku}</div>
                </div>
            ) 
        },
        { 
            header: t('inventory.inbound.col_progress'), 
            accessor: (row) => {
                const percent = Math.min(100, Math.round((row.receivedQty / row.expectedQty) * 100)) || 0;
                return (
                    <div className="inbound-progress-cell">
                        <div className="inbound-progress-labels">
                            <span className="inbound-progress-received">{row.receivedQty}</span>
                            <span className="inbound-progress-expected">/ {row.expectedQty}</span>
                        </div>
                        <ProgressBar percent={percent} />
                    </div>
                );
            }, 
            colWidth: '150px' 
        },
        { 
            header: t('inventory.common.status'), 
            accessor: (row) => {
                const s = getStatusInfo(row.status);
                return (
                    <span className={`inbound-status-badge ${s.class}`}>
                        {s.label}
                    </span>
                 );
            }, 
            colWidth: '110px', 
            align: 'center' 
        },
        { 
            header: t('inventory.common.actions'), 
            accessor: (row) => (
                <button 
                  className={row.status === 'completed' ? "btn btn-outline inbound-action-btn" : "btn btn-primary inbound-action-btn"} 
                  onClick={() => handleSelectForReceive(row)}
                  disabled={row.status === 'completed'}
                >
                    {row.status === 'completed' ? t('inventory.inbound.btn_view') : t('inventory.inbound.btn_work')}
                </button>
            ), 
            colWidth: '120px',
            align: 'center'
        },
    ];

    return (
        <div className="template-page fade-in">
            <PageHeader
                title={t('inventory.inbound.title')}
                description={t('inventory.inbound.desc')}
                breadcrumbs={[t('sidebar.inventory_management'), t('sidebar.inbound_management')]}
            />

            {/* Inbound Working Panel */}
            <Modal
                isOpen={editingInbound !== null}
                onClose={() => setEditingInbound(null)}
                title={<div className="inbound-working-header"><PackagePlus size={18} color="var(--accent-blue)" /> {t('inventory.inbound.work_panel')}</div>}
                size="lg"
                footer={
                    <div className="flex gap-8 justify-end">
                        <button className="btn btn-outline" onClick={() => setEditingInbound(null)}>{t('inventory.inbound.btn_cancel_work')}</button>
                        <button className="btn btn-primary font-600" onClick={handleReceiveSubmit}>
                            <Save size={16} className="mr-6" /> {t('inventory.inbound.btn_save_work')}
                        </button>
                    </div>
                }
            >
                {editingInbound && (
                    <div className="inbound-working-container">
                        <div className="inbound-asn-info">
                            <h4 className="inbound-asn-title">{t('inventory.inbound.asn_info')}</h4>
                            <div className="inbound-asn-grid">
                                <div className="inbound-asn-label">{t('inventory.inbound.asn_info')}</div>
                                <div className="inbound-asn-value important">{editingInbound.inboundNumber}</div>
                                
                                <div className="inbound-asn-label">{t('inventory.common.client')}</div>
                                <div className="inbound-asn-value">{editingInbound.clientName}</div>
                                
                                <div className="inbound-asn-label">{t('inventory.common.sku')}</div>
                                <div className="inbound-asn-value accent">{editingInbound.sku}</div>
                                
                                <div className="inbound-asn-label">{t('inventory.common.item_name')}</div>
                                <div className="inbound-asn-value">{editingInbound.itemName}</div>
                            </div>
                        </div>

                        <div className="inbound-work-inputs">
                            <div className="flex wrap gap-16">
                                <InputField 
                                   label={t('inventory.inbound.qty_input_label', { qty: editingInbound.expectedQty - editingInbound.receivedQty })}
                                   type="number"
                                   min={1}
                                   value={receiveInputQty.toString()}
                                   onChange={(e) => setReceiveInputQty(parseInt(e.target.value) || 0)}
                                   className="inbound-qty-input"
                                />
                                <InputField 
                                   label={t('inventory.inbound.loc_input_label')}
                                   value={receiveLocation}
                                   onChange={(e) => setReceiveLocation(e.target.value)}
                                   placeholder={t('inventory.inbound.loc_placeholder')}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <div className="flex flex-col gap-24">
                <Card title="입고 검색 필터" collapsible>
                    <div className="filter-panel horizontal grid-5">
                         <InputField 
                            label={t('inventory.stock.filter_keyword')} 
                            placeholder={t('inventory.stock.filter_keyword_placeholder')} 
                            className="mb-0" 
                            fullWidth={false}
                         />
                         <SelectField
                             label={t('inventory.common.client')}
                             options={[
                                 { value: '', label: t('inventory.common.client') },
                                 { value: 'a', label: 'A물산' },
                                 { value: 'b', label: 'B유통' },
                             ]}
                             className="mb-0"
                             fullWidth={false}
                         />
                         <SelectField
                             label={t('inventory.common.status')}
                             options={[
                                 { value: '', label: t('inventory.common.status') },
                                 ...statusCodes.map(c => ({ value: c.detailCode, label: c.detailName }))
                             ]}
                             className="mb-0"
                             fullWidth={false}
                         />
                         <div className="filter-actions">
                             <button className="btn btn-primary" onClick={fetchInbound}>
                                 <Search size={16} /> {t('inventory.common.search_btn')}
                             </button>
                         </div>
                    </div>
                </Card>

                <Card title={t('inventory.inbound.asn_list')} noPadding>
                    {loading ? (
                        <div className="inbound-loading">{t('inventory.common.loading')}</div>
                    ) : (
                        <DataTable columns={columns} data={inboundList} />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Inbound;
