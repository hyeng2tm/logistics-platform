import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { DataTable, Column } from '../../components/common/DataTable';
import { InputField, SelectField } from '../../components/common/FormFields';
import { Search, Save, PackageMinus, AlertTriangle } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import { Modal } from '../../components/common/Modal';
import { apiClient } from '../../utils/apiClient';

import { useRef } from 'react';
import './Outbound.css';

const ProgressBar: React.FC<{ percent: number }> = ({ percent }) => {
    const ref = useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (ref.current) {
            ref.current.style.setProperty('--progress-width', `${percent}%`);
        }
    }, [percent]);

    return (
        <div className="outbound-progress-bg">
            <div 
                ref={ref}
                className={`outbound-progress-bar ${percent === 100 ? 'completed' : ''}`}
            ></div>
        </div>
    );
};

interface OutboundData {
  id: number;
  outboundNumber: string; // Based on Order Number usually
  clientName: string;
  destination: string;
  expectedDate: string;
  itemName: string;
  sku: string;
  orderQty: number;
  pickedQty: number;
  status: string;
}

interface CommonCodeDetail {
    detailCode: string;
    detailName: string;
}

const Outbound: React.FC = () => {
    const { t } = useTranslation();
    const { showAlert, showConfirm, showInfo } = useModal();
    const [outboundList, setOutboundList] = useState<OutboundData[]>([]);
    const [statusCodes, setStatusCodes] = useState<CommonCodeDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingWork, setEditingWork] = useState<OutboundData | null>(null);

    // Form inputs for picking
    const [pickInputQty, setPickInputQty] = useState<number>(0);

    const fetchOutbound = async () => {
        setLoading(true);
        try {
            // Mock API
            setOutboundList([
                { id: 1, outboundNumber: 'OUT-ORD-8821', clientName: 'A물산', destination: '서울 강남구', expectedDate: '2023-10-25', itemName: '무선 키보드 K100', sku: 'SKU-A-001', orderQty: 10, pickedQty: 0, status: 'pending' },
                { id: 2, outboundNumber: 'OUT-ORD-8822', clientName: 'B유통', destination: '경기 성남시', expectedDate: '2023-10-25', itemName: '스마트 헤드셋 H20', sku: 'SKU-B-050', orderQty: 50, pickedQty: 25, status: 'picking' },
                { id: 3, outboundNumber: 'OUT-ORD-8810', clientName: 'C산업', destination: '인천 연수구', expectedDate: '2023-10-24', itemName: '산업용 장갑 M', sku: 'SKU-C-999', orderQty: 100, pickedQty: 100, status: 'packed' },
                { id: 4, outboundNumber: 'OUT-ORD-8825', clientName: 'D컴퍼니', destination: '부산 해운대구', expectedDate: '2023-10-26', itemName: '고급 복사 용지 A4', sku: 'SKU-D-100', orderQty: 500, pickedQty: 0, status: 'shortage' },
            ]);
        } catch (error) {
            console.error("Error fetching outbound:", error);
            setOutboundList([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatusCodes = async () => {
        try {
            const data = await apiClient.get<CommonCodeDetail[]>('/api/v1/system/codes/INV-002/details');
            setStatusCodes(data);
        } catch (error) {
            console.error("Failed to fetch status codes", error);
        }
    }

    useEffect(() => {
        fetchOutbound();
        fetchStatusCodes();
    }, []);

    const handleSelectForPick = (row: OutboundData) => {
        if (row.status === 'packed' || row.status === 'shipped') {
            showAlert({ title: t('common.notifications'), message: 'msg.already_completed' });
            return;
        }
        if (row.status === 'shortage') {
            showInfo({ title: t('inventory.outbound.status_shortage'), message: 'msg.shortage_warning' });
        }
        setEditingWork(row);
        setPickInputQty(row.orderQty - row.pickedQty); // Default to remaining
    };

    const handlePickSubmit = async () => {
        if (!editingWork) return;
        if (pickInputQty <= 0) {
            showAlert({ title: t('common.input_error'), message: 'msg.invalid_quantity' });
            return;
        }

        showConfirm({
            title: t('inventory.outbound.save_confirm_title'),
            message: 'msg.save_confirm',
            confirmText: t('inventory.common.save_btn'),
            onConfirm: async () => {
                try {
                    showAlert({ title: t('common.save_complete'), message: 'msg.save_success' });
                    
                    // Mock UI update
                    setOutboundList(prev => prev.map(item => {
                        if (item.id === editingWork.id) {
                            const newTotal = item.pickedQty + pickInputQty;
                            return { ...item, pickedQty: newTotal, status: newTotal >= item.orderQty ? 'packed' : 'picking' };
                        }
                        return item;
                    }));
                    setEditingWork(null);
                } catch (error: unknown) {
                    console.error("Pick error:", error);
                    showAlert({ title: t('common.save_failed'), message: 'msg.error_occurred' });
                }
            }
        });
    };

    const handleShipOut = (row: OutboundData) => {
        showConfirm({
            title: t('inventory.outbound.ship_confirm_title'),
            message: 'msg.ship_confirm',
            confirmText: t('common.save'),
            onConfirm: () => {
                showAlert({ title: t('common.save_complete'), message: 'msg.save_success' });
                setOutboundList(prev => prev.map(item => item.id === row.id ? { ...item, status: 'shipped' } : item));
            }
        });
    }

    const getStatusInfo = (status: string) => {
        const code = statusCodes.find(c => c.detailCode === status);
        const label = code ? code.detailName : status;

        switch(status) {
            case 'pending': return { class: 'status-pending', label };
            case 'picking': return { class: 'status-picking', label };
            case 'packed': return { class: 'status-packed', label };
            case 'shipped': return { class: 'status-shipped', label };
            case 'shortage': return { class: 'status-shortage', label };
            default: return { class: '', label };
        }
    };

    const columns: Column<OutboundData>[] = [
        { header: t('inventory.outbound.pick_list'), accessor: 'outboundNumber', colWidth: '140px' },
        { header: t('inventory.common.client'), accessor: 'clientName', colWidth: '100px' },
        { header: t('inventory.inbound.loc_input_label'), accessor: 'destination', colWidth: '120px' }, // destination? reuse location label?
        { 
            header: `${t('inventory.common.item_name')} / ${t('inventory.common.sku')}`, 
            accessor: (row) => (
                <div className="outbound-info-cell">
                    <div className="outbound-item-name">{row.itemName}</div>
                    <div className="outbound-sku-name">{row.sku}</div>
                </div>
            ) 
        },
        { 
            header: t('inventory.inbound.col_progress'), 
            accessor: (row) => {
                const percent = Math.min(100, Math.round((row.pickedQty / row.orderQty) * 100)) || 0;
                return (
                    <div className="outbound-progress-cell">
                        <div className="outbound-progress-labels">
                            <span className="outbound-progress-picked">{row.pickedQty}</span>
                            <span className="outbound-progress-order">/ {row.orderQty}</span>
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
                    <span className={`outbound-status-badge ${s.class}`}>
                        {s.label}
                    </span>
                 );
            }, 
            colWidth: '110px', 
            align: 'center' 
        },
        { 
            header: t('common.actions'), 
            accessor: (row) => (
                <div className="outbound-action-container">
                    <button 
                      className="btn btn-primary btn-sm w-90" 
                      onClick={() => handleSelectForPick(row)}
                      disabled={row.status === 'packed' || row.status === 'shipped'}
                    >
                        {t('inventory.outbound.btn_pick')}
                    </button>
                    {(row.status === 'packed' || row.status === 'shipped') && (
                       <button 
                         className="btn btn-outline btn-sm w-90" 
                         onClick={() => handleShipOut(row)}
                         disabled={row.status === 'shipped'}
                       >
                           {t('inventory.outbound.btn_ship')}
                       </button>
                    )}
                </div>
            ), 
            colWidth: '100px',
            align: 'center'
        },
    ];

    return (
        <div className="template-page fade-in">
            <PageHeader
                title={t('inventory.outbound.title')}
                description={t('inventory.outbound.desc')}
                breadcrumbs={[t('sidebar.inventory_management'), t('sidebar.outbound_management')]}
            />

            {/* Outbound Working Panel */}
            <Modal
                isOpen={editingWork !== null}
                onClose={() => setEditingWork(null)}
                title={<div className="outbound-working-header"><PackageMinus size={18} color="#F59E0B" /> {t('inventory.outbound.work_panel')}</div>}
                size="lg"
                footer={
                    <div className="flex gap-8 justify-end">
                        <button className="btn btn-outline" onClick={() => setEditingWork(null)}>{t('inventory.outbound.btn_close_work')}</button>
                        <button 
                            className="btn btn-primary font-600 outbound-pick-btn" 
                            onClick={handlePickSubmit}
                        >
                            <Save size={16} className="mr-6" /> {t('inventory.outbound.btn_complete_pick')}
                        </button>
                    </div>
                }
            >
                {editingWork && (
                    <div className="outbound-working-container">
                        <div className="outbound-order-detail">
                            <h4 className="outbound-order-title">{t('inventory.outbound.order_detail')}</h4>
                            <div className="outbound-order-grid">
                                <div className="outbound-order-label">{t('inventory.outbound.order_detail')}</div>
                                <div className="outbound-order-value important">{editingWork.outboundNumber}</div>
                                
                                <div className="outbound-order-label">{t('inventory.inbound.loc_input_label')}</div>
                                <div className="outbound-order-value">{editingWork.destination}</div>
                                
                                <div className="outbound-order-label">{t('inventory.common.sku')}</div>
                                <div className="outbound-order-value accent">{editingWork.sku}</div>
                                
                                <div className="outbound-order-label">{t('inventory.common.item_name')}</div>
                                <div className="outbound-order-value">{editingWork.itemName}</div>
                            </div>
                        </div>

                        <div className="outbound-work-inputs">
                            <div className="flex wrap gap-16">
                                <InputField 
                                   label={t('inventory.outbound.pick_qty_label', { qty: editingWork.orderQty - editingWork.pickedQty })}
                                   type="number"
                                   min={1}
                                   value={pickInputQty.toString()}
                                   onChange={(e) => setPickInputQty(parseInt(e.target.value) || 0)}
                                   className="outbound-pick-input"
                                />
                                <div className="outbound-warning-box">
                                     <AlertTriangle size={18} className="outbound-warning-icon" /> {t('inventory.outbound.pick_warning')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <div className="flex flex-col gap-24">
                <Card title="출고 검색 필터" collapsible>
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
                             <button className="btn btn-primary" onClick={fetchOutbound}>
                                 <Search size={16} /> {t('inventory.common.search_btn')}
                             </button>
                         </div>
                    </div>
                </Card>

                <Card title={t('inventory.outbound.pick_list')} noPadding>
                    {loading ? (
                        <div className="outbound-loading">{t('inventory.common.loading')}</div>
                    ) : (
                        <DataTable columns={columns} data={outboundList} />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Outbound;
