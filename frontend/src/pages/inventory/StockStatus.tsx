import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { DataTable, Column } from '../../components/common/DataTable';
import { InputField, SelectField } from '../../components/common/FormFields';
import { Search, MapPin, Download, ArrowRightLeft } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';

import './StockStatus.css';

interface StockData {
  id: number;
  clientName: string;
  sku: string;
  itemName: string;
  category: string;
  location: string;
  totalQty: number;
  availableQty: number; // Qty not tied to outbound orders
  allocatedQty: number; // Qty tied to outbound orders
  lastUpdated: string;
}

const StockStatus: React.FC = () => {
    const { t } = useTranslation();
    const { showAlert, showConfirm } = useModal();
    const [stocks, setStocks] = useState<StockData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStocks = async () => {
        setLoading(true);
        try {
            // Mock API
            setStocks([
                { id: 1, clientName: 'A물산', sku: 'SKU-A-001', itemName: '무선 키보드 K100', category: '전자기기', location: 'A-01-01', totalQty: 1500, availableQty: 1450, allocatedQty: 50, lastUpdated: '2023-10-25 09:12' },
                { id: 2, clientName: 'B유통', sku: 'SKU-B-050', itemName: '스마트 헤드셋 H20', category: '음향기기', location: 'B-02-12', totalQty: 300, availableQty: 250, allocatedQty: 50, lastUpdated: '2023-10-24 15:30' },
                { id: 3, clientName: 'C산업', sku: 'SKU-C-999', itemName: '산업용 장갑 M', category: '안전용품', location: 'C-05-99', totalQty: 5000, availableQty: 5000, allocatedQty: 0, lastUpdated: '2023-10-20 11:45' },
                { id: 4, clientName: 'D컴퍼니', sku: 'SKU-D-100', itemName: '고급 복사 용지 A4', category: '사무용품', location: 'A-03-05', totalQty: 50, availableQty: 0, allocatedQty: 50, lastUpdated: '2023-10-23 18:20' },
                { id: 5, clientName: 'A물산', sku: 'SKU-A-002', itemName: '인체공학 마우스 M50', category: '전자기기', location: 'A-01-02', totalQty: 800, availableQty: 800, allocatedQty: 0, lastUpdated: '2023-10-25 09:15' },
            ]);
        } catch (error) {
            console.error("Error fetching stocks:", error);
            setStocks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStocks();
    }, []);

    const handleLocationMove = (row: StockData) => {
        showConfirm({
            title: t('inventory.stock.move_confirm_title'),
            message: t('inventory.stock.move_confirm_msg', { name: row.itemName, location: row.location, qty: row.availableQty }),
            confirmText: t('inventory.stock.btn_move'),
            onConfirm: () => {
                showAlert({ title: t('common.notifications'), message: t('inventory.stock.move_next_phase') });
            }
        });
    }

    const getQtyStatusClass = (available: number, allocated: number) => {
        if (available === 0) return 'qty-status-critical';
        if (available <= allocated) return 'qty-status-warning';
        return 'qty-status-healthy';
    };

    const columns: Column<StockData>[] = [
        { header: t('inventory.common.client'), accessor: 'clientName', colWidth: '100px' },
        { header: t('inventory.common.sku'), accessor: 'sku', colWidth: '130px' },
        { 
            header: `${t('inventory.common.item_name')} / ${t('inventory.common.category')}`, 
            accessor: (row) => (
                <div className="stock-info-cell">
                   <div className="stock-item-name">{row.itemName}</div>
                   <div className="stock-category-name">{row.category}</div>
                </div>
            ) 
        },
        { 
            header: t('inventory.common.location'), 
            accessor: (row) => (
                <div className="stock-location-cell">
                    <MapPin size={14} /> {row.location}
                </div>
            ), 
            colWidth: '140px' 
        },
        { 
            header: t('inventory.stock.col_total'), 
            accessor: (row) => (
                <span className="stock-qty-total">
                    {row.totalQty.toLocaleString()}
                </span>
            ), 
            align: 'right', 
            colWidth: '120px' 
        },
        { 
            header: t('inventory.stock.col_available'), 
            accessor: (row) => (
                <span className={`stock-qty-available ${getQtyStatusClass(row.availableQty, row.allocatedQty)}`}>
                    {row.availableQty.toLocaleString()}
                </span>
            ), 
            align: 'right', 
            colWidth: '140px' 
        },
        { 
            header: t('inventory.stock.col_allocated'), 
            accessor: (row) => (
                <span className="stock-qty-allocated">
                    {row.allocatedQty.toLocaleString()}
                </span>
            ), 
            align: 'right', 
            colWidth: '140px' 
        },
        { header: t('inventory.stock.col_updated'), accessor: 'lastUpdated', colWidth: '150px', align: 'center' },
        { 
            header: t('inventory.common.actions'), 
            accessor: (row) => (
                <div className="flex justify-center">
                    <button 
                      className="btn btn-outline btn-sm flex items-center gap-4" 
                      onClick={() => handleLocationMove(row)}
                    >
                        <ArrowRightLeft size={14} /> {t('inventory.stock.btn_move')}
                    </button>
                </div>
            ), 
            colWidth: '120px',
            align: 'center'
        },
    ];

    const headerActions = (
        <button className="btn btn-outline" onClick={() => showAlert({ title: t('common.notifications'), message: t('inventory.stock.btn_excel') })}>
            <Download size={18} /> {t('inventory.stock.btn_excel')}
        </button>
    );

    return (
        <div className="template-page fade-in">
            <PageHeader
                title={t('inventory.stock.title')}
                description={t('inventory.stock.desc')}
                breadcrumbs={[t('sidebar.inventory_management'), t('sidebar.stock_status')]}
                actions={headerActions}
            />

            <div className="flex flex-col gap-24">
                
                <div className="stock-dashboard-grid">
                    <div className="stat-card stock-stat-card">
                        <h3 className="stock-stat-label">{t('inventory.stock.total_skus')}</h3>
                        <div className="stock-stat-value">{stocks.length.toLocaleString()}</div>
                    </div>
                    <div className="stat-card stock-stat-card">
                        <h3 className="stock-stat-label">{t('inventory.stock.total_available')}</h3>
                        <div className="stock-stat-value healthy">
                            {stocks.reduce((acc, obj) => acc + obj.availableQty, 0).toLocaleString()}
                        </div>
                    </div>
                    <div className="stat-card stock-stat-card">
                        <h3 className="stock-stat-label">{t('inventory.stock.total_allocated')}</h3>
                        <div className="stock-stat-value warning">
                            {stocks.reduce((acc, obj) => acc + obj.allocatedQty, 0).toLocaleString()}
                        </div>
                    </div>
                    <div className="stat-card stock-stat-card critical-bg">
                        <h3 className="stock-stat-label critical">{t('inventory.stock.shortage_items')}</h3>
                        <div className="stock-stat-value critical">
                            {stocks.filter(s => s.availableQty === 0).length}
                        </div>
                    </div>
                </div>

                <Card title={t('inventory.stock.filter_title')}>
                    <div className="filter-panel horizontal grid-5">
                         <SelectField
                             label={t('inventory.common.client')}
                             options={[
                                 { value: '', label: t('inventory.common.client') },
                                 { value: 'a', label: 'A물산' },
                                 { value: 'b', label: 'B유통' },
                                 { value: 'c', label: 'C산업' },
                             ]}
                             className="mb-0"
                             fullWidth={false}
                         />
                         <SelectField
                             label={t('inventory.stock.filter_zone')}
                             options={[
                                 { value: '', label: t('inventory.stock.filter_zone_all') },
                                 { value: 'A', label: 'A Zone' },
                                 { value: 'B', label: 'B Zone' },
                                 { value: 'C', label: 'C Zone' },
                             ]}
                             className="mb-0"
                             fullWidth={false}
                         />
                         <InputField 
                            label={t('inventory.stock.filter_keyword')} 
                            placeholder={t('inventory.stock.filter_keyword_placeholder')} 
                            className="mb-0" 
                            fullWidth={false} 
                         />
                         <div className="filter-actions">
                             <button className="btn btn-primary" onClick={fetchStocks}>
                                 <Search size={16} /> {t('inventory.common.search_btn')}
                             </button>
                         </div>
                    </div>
                </Card>

                <Card title="재고 현황 목록" noPadding>
                    {loading ? (
                        <div className="stock-loading">{t('inventory.common.loading')}</div>
                    ) : (
                        <DataTable columns={columns} data={stocks} />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default StockStatus;
