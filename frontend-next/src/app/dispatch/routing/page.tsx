'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { DataTable, Column } from '../../../components/common/DataTable';
import { InputField, SelectField } from '../../../components/common/FormFields';
import { Search, Map as MapIcon, RotateCw, Flag, CheckCircle2, Navigation } from 'lucide-react';
import { useModal } from '../../../contexts/ModalContext';
import './Routing.css';

// Mock Interfaces
interface RouteData {
  id: number;
  vehicleNumber: string;
  driverName: string;
  assignedOrderCount: number;
  routeStatus: 'waiting' | 'in_transit' | 'completed';
  departureTime?: string;
  arrivalTime?: string;
  currentLocation?: string;
}

interface StopData {
    orderNumber: string;
    destination: string;
    clientName: string;
    status: 'pending' | 'arrived' | 'unloaded';
    sequence: number;
}

const Routing: React.FC = () => {
    const { t } = useTranslation();
    const { showAlert, showInfo } = useModal();
    const [routes, setRoutes] = useState<RouteData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
    const [stops, setStops] = useState<StopData[]>([]);

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            // Mock API response until dispatch backend is built
            // const data = await apiClient.get<RouteData[]>('/api/v1/dispatch/routes');
            setRoutes([
                { id: 1, vehicleNumber: '서울 81자 1234', driverName: '김기사', assignedOrderCount: 3, routeStatus: 'in_transit', departureTime: '08:00', currentLocation: '경기도 용인시 기흥구' },
                { id: 2, vehicleNumber: '경기 92바 5678', driverName: '이운전', assignedOrderCount: 1, routeStatus: 'waiting' },
                { id: 3, vehicleNumber: '인천 33사 9012', driverName: '박물류', assignedOrderCount: 5, routeStatus: 'completed', departureTime: '06:30', arrivalTime: '14:20' },
            ]);
        } catch (error) {
            console.warn("Error fetching routes:", error);
            setRoutes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchStops = (routeId: number) => {
        // Mock data fetch for a specific route's stops
        const mockStops: Record<number, StopData[]> = {
            1: [
                { sequence: 1, orderNumber: 'ORD-1001', clientName: 'A물산', destination: '경기도 화성시 동탄', status: 'unloaded' },
                { sequence: 2, orderNumber: 'ORD-1004', clientName: 'B유통', destination: '경기도 용인시 처인구', status: 'arrived' },
                { sequence: 3, orderNumber: 'ORD-1005', clientName: 'C산업', destination: '경기도 평택시 고덕', status: 'pending' },
            ],
            2: [
                { sequence: 1, orderNumber: 'ORD-1009', clientName: 'D컴퍼니', destination: '서울 강서구 마곡', status: 'pending' },
            ],
            3: [
                { sequence: 1, orderNumber: 'ORD-0991', clientName: 'A물산', destination: '인천 연수구 송도', status: 'unloaded' },
                { sequence: 2, orderNumber: 'ORD-0992', clientName: 'E상사', destination: '인천 남동구', status: 'unloaded' },
                { sequence: 3, orderNumber: 'ORD-0994', clientName: 'F물류', destination: '부천 오정구', status: 'unloaded' },
                { sequence: 4, orderNumber: 'ORD-0997', clientName: 'G산업', destination: '서울 구로구', status: 'unloaded' },
                { sequence: 5, orderNumber: 'ORD-0998', clientName: 'H유통', destination: '서울 영등포구', status: 'unloaded' },
            ]
        };
        setStops(mockStops[routeId] || []);
    };

    const handleSelectRoute = (row: RouteData) => {
        setSelectedRoute(row);
        fetchStops(row.id);
    };

    const handleOptimizeRoute = () => {
        if (!selectedRoute || selectedRoute.routeStatus === 'completed') {
            showAlert({ 
                title: t('dispatch.routing.messages.opt_fail_title'), 
                message: t('dispatch.routing.messages.opt_fail_msg') 
            });
            return;
        }

        // Simulate API call for Route Optimization (e.g. TSP logic)
        showAlert({ 
            title: t('dispatch.routing.messages.opt_progress_title'), 
            message: t('dispatch.routing.messages.opt_progress_msg') 
        });
        
        setTimeout(() => {
            // Mock re-ordering array randomly to simulate optimization
            const optimized = [...stops].sort(() => Math.random() - 0.5)
              .map((s, idx) => ({ ...s, sequence: idx + 1 }));
            
            setStops(optimized);
            showInfo({ 
                title: t('dispatch.routing.messages.opt_success_title'), 
                message: t('dispatch.routing.messages.opt_success_msg') 
            });
        }, 1500);
    };

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'waiting': return { bg: '#F8FAFC', text: '#64748B', label: t('dispatch.routing.status.waiting') };
            case 'in_transit': return { bg: '#E0F2FE', text: '#0284C7', label: t('dispatch.routing.status.in_transit') };
            case 'completed': return { bg: '#E6F9F4', text: '#05CD99', label: t('dispatch.routing.status.completed') };
            default: return { bg: '#F1F5F9', text: '#475569', label: status };
        }
    };

    const columns: Column<RouteData>[] = [
        { header: t('dispatch.routing.fields.vehicle_no'), accessor: 'vehicleNumber', colWidth: '130px' },
        { header: t('dispatch.routing.fields.driver'), accessor: 'driverName', colWidth: '100px' },
        { 
            header: t('dispatch.routing.fields.order_count'), 
            accessor: (row) => t('dashboard.unit_cases', { count: row.assignedOrderCount }), 
            colWidth: '100px', 
            align: 'center' 
        },
        { 
            header: t('dispatch.routing.fields.status'), 
            accessor: (row) => {
                const s = getStatusStyle(row.routeStatus);
                return (
                    <span className={`status-badge ${row.routeStatus}`}>
                        {s.label}
                    </span>
                 );
            }, 
            colWidth: '120px', 
            align: 'center' 
        },
        { header: t('dispatch.routing.fields.departure'), accessor: (row) => row.departureTime || '-', colWidth: '100px', align: 'center' },
        { 
            header: t('dispatch.routing.fields.actions'), 
            accessor: (row) => (
                <button 
                  className="btn btn-outline btn-details" 
                  onClick={() => handleSelectRoute(row)}>
                    {t('dispatch.routing.btn_details')}
                </button>
            ), 
            colWidth: '120px',
            align: 'center'
        },
    ];

    return (
        <div className="template-page fade-in">
            <PageHeader
                title={t('dispatch.routing.title')}
                description={t('dispatch.routing.desc')}
                breadcrumbs={[t('sidebar.shipment_management'), t('sidebar.routing_management')]}
            />

            <div className="routing-main-grid">
                {/* Left side: Route Status List */}
                <div className="routing-routes-section flex flex-col gap-24">
                    <Card title={t('dispatch.routing.search_title')} collapsible>
                        <div className="filter-panel horizontal grid-4">
                             <InputField 
                                label={t('dispatch.routing.search_placeholder')} 
                                placeholder={t('dispatch.routing.search_placeholder')} 
                                fullWidth={false}
                             />
                             <SelectField
                                 label={t('dispatch.routing.status_label')}
                                 options={[
                                     { value: '', label: t('dispatch.routing.status_all') },
                                     { value: 'waiting', label: t('dispatch.routing.status.waiting') },
                                     { value: 'in_transit', label: t('dispatch.routing.status.in_transit') },
                                     { value: 'completed', label: t('dispatch.routing.status.completed') },
                                 ]}
                                 fullWidth={false}
                             />
                             {/* Spacer to push button to the 4th column */}
                             <div></div>
                             <div className="routing-search-actions">
                                <button className="btn btn-primary routing-search-btn" onClick={fetchRoutes}>
                                    <Search size={18} /> {t('dispatch.common.search')}
                                </button>
                             </div>
                        </div>
                    </Card>

                    <Card title={t('dispatch.routing.list_title')} noPadding>
                        {loading ? (
                            <div className="loading-message">{t('dispatch.common.loading')}</div>
                        ) : (
                            <div className="data-table-wrapper">
                                <DataTable columns={columns} data={routes} />
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right side: Route Detail Map/Stops */}
                <div className="route-detail-column">
                    <Card 
                        title={t('dispatch.routing.detail_title')} 
                        headerActions={
                            <div className="card-actions-wrapper">
                               <button 
                                 className="btn btn-text text-primary btn-optimize" 
                                 onClick={handleOptimizeRoute}
                                 disabled={!selectedRoute || selectedRoute.routeStatus === 'completed'}
                               >
                                  <RotateCw size={16} className="icon-mr-6" /> {t('dispatch.routing.optimize_btn')}
                               </button>
                            </div>
                        }
                    >
                        {!selectedRoute ? (
                            <div className="empty-detail-state">
                                <MapIcon size={48} color="#E2E8F0" />
                                <span>{t('dispatch.routing.empty_msg')}</span>
                            </div>
                        ) : (
                            <div className="route-detail-panel fade-in">
                                <div className="route-detail-summary">
                                    <div className="route-detail-summary-header">
                                        <h4 className="route-detail-title">
                                            <Navigation size={18} color="var(--accent-blue)" /> {selectedRoute.vehicleNumber} ({selectedRoute.driverName})
                                        </h4>
                                        <span className={`status-badge ${selectedRoute.routeStatus}`}>
                                            {getStatusStyle(selectedRoute.routeStatus).label}
                                        </span>
                                    </div>
                                    <div className="route-detail-loc">
                                        <strong>{t('dispatch.routing.current_loc')}:</strong> {selectedRoute.currentLocation || t('dispatch.routing.no_info')}
                                    </div>
                                </div>

                                <div className="stops-timeline">
                                    <div className="timeline-flag-start">
                                         <Flag size={14} color="#64748B" />
                                    </div>
                                    
                                    {stops.length === 0 && <div className="empty-stops-msg">{t('dispatch.routing.no_stops')}</div>}

                                    {stops.map((stop) => (
                                        <div key={stop.orderNumber} className="stop-item">
                                            <div className={`stop-indicator ${stop.status}`}></div>
                                            <div className="stop-content">
                                                <div>
                                                    <span className="stop-sequence-label">{t('dispatch.routing.stop_label', { seq: stop.sequence })}</span>
                                                    <div className="stop-client-name">{stop.clientName}</div>
                                                    <div className="stop-destination">{stop.destination}</div>
                                                    <div className="stop-order-num">{stop.orderNumber}</div>
                                                </div>
                                                <div>
                                                    {stop.status === 'unloaded' && <span className="stop-status-complete"><CheckCircle2 size={14} /> {t('dispatch.routing.status_unloaded')}</span>}
                                                    {stop.status === 'arrived' && <span className="stop-status-arrived">{t('dispatch.routing.status_arrived')}</span>}
                                                    {stop.status === 'pending' && <span className="stop-status-pending">{t('dispatch.routing.status_pending')}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="timeline-flag-end">
                                         <Flag size={14} color="#64748B" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Routing;
