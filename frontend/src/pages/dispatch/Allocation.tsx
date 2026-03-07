import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { DataTable, Column } from '../../components/common/DataTable';
import { InputField, SelectField } from '../../components/common/FormFields';
import { Map, Save, Calendar, Truck, User, Search } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';
import { useModal } from '../../contexts/ModalContext';
import './Allocation.css';

// Mock Interfaces until backend is fully ready
interface AllocationOrder {
  id: number;
  orderNumber: string;
  clientName: string;
  destination: string;
  orderDate: string;
  status: 'pending' | 'processing'; // Only these are ready for allocation
  totalAmount: number;
}

interface VehicleInfo {
  id: number;
  vehicleNumber: string;
  capacity: string;
  driverName: string;
}

const Allocation: React.FC = () => {
    const { t } = useTranslation();
    const { showAlert, showConfirm } = useModal();
    const [orders, setOrders] = useState<AllocationOrder[]>([]);
    const [vehicles, setVehicles] = useState<VehicleInfo[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
    const [selectedVehicle, setSelectedVehicle] = useState<string>('');

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Fetch only pending/processing orders for allocation
            const data = await apiClient.get<AllocationOrder[]>('/api/v1/sales/orders?status=pending');
            setOrders(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
            // Mock data fallback if backend API for orders fails or is empty for testing
            setOrders([]);
        } 
        
        try {
            // Fetch vehicles - mock endpoint for now since we haven't built the vehicle master yet
            // const vehicleData = await apiClient.get('/api/v1/dispatch/vehicles');
            // Mocking:
            setVehicles([
                { id: 1, vehicleNumber: '서울 81자 1234', capacity: '1톤', driverName: '김기사' },
                { id: 2, vehicleNumber: '경기 92바 5678', capacity: '5톤', driverName: '이운전' },
                { id: 3, vehicleNumber: '인천 33사 9012', capacity: '11톤', driverName: '박물류' },
            ]);
        } catch { /* ignore */ }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const toggleRowSelection = (id: number) => {
        const newSet = new Set(selectedOrders);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedOrders(newSet);
    };

    const toggleAllSelection = (checked: boolean) => {
        if (checked) {
            setSelectedOrders(new Set(orders.map(o => o.id)));
        } else {
            setSelectedOrders(new Set());
        }
    };

    const handleAllocate = () => {
        if (selectedOrders.size === 0) {
            showAlert({ 
                title: t('dispatch.allocation.messages.error_title'), 
                message: t('dispatch.allocation.messages.select_order') 
            });
            return;
        }
        if (!selectedVehicle) {
            showAlert({ 
                title: t('dispatch.allocation.messages.error_title'), 
                message: t('dispatch.allocation.messages.select_vehicle') 
            });
            return;
        }

        const vehicleObj = vehicles.find(v => v.id.toString() === selectedVehicle);

        showConfirm({
            title: t('dispatch.allocation.messages.confirm_title'),
            message: t('dispatch.allocation.messages.confirm_msg', { 
                count: selectedOrders.size, 
                vehicle: vehicleObj?.vehicleNumber 
            }),
            confirmText: t('dispatch.allocation.messages.execute_btn'),
            onConfirm: async () => {
                try {
                    // API Call would go here:
                    // await apiClient.post('/api/v1/dispatch/allocate', { orderIds: Array.from(selectedOrders), vehicleId: selectedVehicle });
                    showAlert({ 
                        title: t('dispatch.allocation.messages.success_title'), 
                        message: t('dispatch.allocation.messages.success_msg') 
                    });
                    setSelectedOrders(new Set());
                    setSelectedVehicle('');
                    // Mock: remove allocated orders from list
                    setOrders(prev => prev.filter(o => !selectedOrders.has(o.id)));
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : String(error);
                    showAlert({ 
                        title: t('dispatch.allocation.messages.fail_title'), 
                        message: t('dispatch.allocation.messages.fail_msg') + '\n' + message 
                    });
                }
            }
        });
    };

    const columns: Column<AllocationOrder>[] = [
        {
            header: (
                <input 
                   type="checkbox" 
                   checked={orders.length > 0 && selectedOrders.size === orders.length}
                   onChange={(e) => toggleAllSelection(e.target.checked)} 
                   title="Select all orders"
                   aria-label="Select all orders"
                />
            ),
            accessor: (row) => (
                <input 
                   type="checkbox" 
                   checked={selectedOrders.has(row.id)}
                   onChange={() => toggleRowSelection(row.id)} 
                   title={`Select order ${row.orderNumber}`}
                   aria-label={`Select order ${row.orderNumber}`}
                />
            ),
            colWidth: '50px',
            align: 'center'
        },
        { header: t('dispatch.allocation.fields.order_no'), accessor: 'orderNumber', colWidth: '130px' },
        { header: t('dispatch.allocation.fields.order_date'), accessor: 'orderDate', colWidth: '120px' },
        { header: t('dispatch.allocation.fields.client'), accessor: 'clientName', colWidth: '150px' },
        { header: t('dispatch.allocation.fields.destination'), accessor: 'destination' },
        { 
            header: t('dispatch.allocation.fields.status'), 
            accessor: () => <span className="allocation-status-badge">{t('dispatch.allocation.status_waiting')}</span>, 
            colWidth: '100px', 
            align: 'center' 
        }
    ];

    return (
        <div className="template-page fade-in">
            <PageHeader
                title={t('dispatch.allocation.title')}
                description={t('dispatch.allocation.desc')}
                breadcrumbs={[t('sidebar.shipment_management'), t('sidebar.allocation_management')]}
            />

            <div className="allocation-grid">
                {/* Left side: Orders to be allocated */}
                <div className="allocation-orders-section flex flex-col gap-24">
                    <Card title={t('dispatch.allocation.search_title')}>
                        <div className="filter-panel horizontal grid-4">
                             <InputField 
                                label={t('dispatch.allocation.order_no_search')} 
                                placeholder="ORD-..." 
                                className="allocation-search-item" 
                             />
                             <InputField 
                                label={t('dispatch.allocation.dest_search')} 
                                placeholder={t('dispatch.allocation.dest_search')} 
                                className="allocation-search-item" 
                             />
                             <div className="form-group allocation-search-item">
                                 <label className="form-label">{t('dispatch.allocation.deadline_label')}</label>
                                 <div className="form-input allocation-date-picker">
                                     <Calendar size={16} className="allocation-date-icon" /> {t('dispatch.allocation.all_today')}
                                 </div>
                             </div>
                             <div className="allocation-search-actions">
                                <button className="btn btn-primary allocation-filter-btn" onClick={fetchOrders}>
                                    <Search size={18} /> {t('dispatch.common.search')}
                                </button>
                             </div>
                        </div>
                    </Card>

                    <Card title={t('dispatch.allocation.list_title')} noPadding>
                        {loading ? (
                            <div className="allocation-loading-msg">{t('dispatch.common.loading')}</div>
                        ) : (
                            <div className="allocation-data-table-container">
                                <DataTable columns={columns} data={orders} />
                                {orders.length === 0 && (
                                    <div className="allocation-empty-msg">
                                        {t('dispatch.allocation.empty_msg')}
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right side: Vehicle Allocation Panel */}
                <div className="allocation-panel">
                    <Card title={t('dispatch.allocation.panel_title')} bodyClassName="p-20">
                        <div className="allocation-summary-box">
                             <span className="allocation-summary-label">{t('dispatch.allocation.selected_count')}</span>
                             <span className="allocation-summary-value">{t('dashboard.unit_cases', { count: selectedOrders.size })}</span>
                        </div>

                        <div className="allocation-vehicle-select">
                             <SelectField
                                 label={t('dispatch.allocation.vehicle_select')}
                                 value={selectedVehicle}
                                 onChange={(e) => setSelectedVehicle(e.target.value)}
                                 options={[
                                     { value: '', label: t('dispatch.allocation.vehicle_placeholder') },
                                     ...vehicles.map(v => ({ value: v.id.toString(), label: `${v.vehicleNumber} (${v.capacity}) - ${v.driverName}` }))
                                 ]}
                                 className="allocation-search-item"
                             />
                        </div>

                        {selectedVehicle && (
                            <div className="allocation-vehicle-details">
                                <h4 className="allocation-vehicle-details-title">
                                    <Truck size={16} /> {t('dispatch.allocation.vehicle_detail_title')}
                                </h4>
                                {(() => {
                                    const v = vehicles.find(v => v.id.toString() === selectedVehicle);
                                    if(!v) return null;
                                    return (
                                        <div className="allocation-vehicle-details-grid">
                                            <div>
                                                <span className="allocation-vehicle-detail-item">{t('dispatch.allocation.vehicle_no')}</span>
                                                <strong className="allocation-vehicle-detail-value">{v.vehicleNumber}</strong>
                                            </div>
                                            <div>
                                                <span className="allocation-vehicle-detail-item">{t('dispatch.allocation.vehicle_capacity')}</span>
                                                <strong className="allocation-vehicle-detail-value">{v.capacity}</strong>
                                            </div>
                                            <div className="allocation-driver-info">
                                                <User size={16} color="var(--text-tertiary)" />
                                                <strong className="allocation-vehicle-detail-value">{v.driverName}</strong> {t('dispatch.allocation.driver_assigned')}
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                        )}

                        <button 
                            className="btn btn-primary allocation-submit-btn" 
                            disabled={selectedOrders.size === 0 || !selectedVehicle}
                            onClick={handleAllocate}
                        >
                            <Save size={20} className="allocation-submit-icon" /> {t('dispatch.allocation.confirm_btn')}
                        </button>
                    </Card>

                    <Card title={t('dispatch.allocation.helper_title')} bodyClassName="p-20">
                        <div className="allocation-helper-box">
                             <Map size={24} className="allocation-helper-icon" />
                             {t('dispatch.allocation.helper_msg')}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Allocation;
