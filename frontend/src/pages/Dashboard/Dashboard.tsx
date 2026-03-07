import React from 'react';
import { Truck, Package, RotateCcw, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Dashboard.css';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import { useModal } from '../../contexts/ModalContext';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { showAlert, showInfo } = useModal();
  
  const callHealthApi = async () => {
    try {
      const res = await fetchWithAuth("/api/health");
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      showInfo({ 
        title: 'dashboard.api_health_check', 
        message: 'msg.health_check_success', 
        messageValues: [JSON.stringify(data)] 
      });
    } catch (e) {
      showAlert({ 
        title: 'dashboard.api_health_check', 
        message: 'msg.api_request_failed', 
        messageValues: [e instanceof Error ? e.message : String(e)] 
      });
    }
  };

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header-text">
        <h1 className="dashboard-title">{t('dashboard.welcome_title')}</h1>
        <p className="dashboard-subtitle">{t('dashboard.welcome_desc')}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <Truck size={24} />
          </div>
          <div className="stat-info">
            <h3>{t('dashboard.shipments_in_progress')}</h3>
            <div className="stat-value">1,248 <span className="stat-unit">{t('dashboard.unit_cases')}</span></div>
            <div className="stat-trend positive">
              <TrendingUp size={14} /> <span>12% {t('dashboard.trend_increase')} {t('dashboard.trend_vs_last_week')}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <h3>{t('dashboard.orders_pending')}</h3>
            <div className="stat-value">342 <span className="stat-unit">{t('dashboard.unit_cases')}</span></div>
            <div className="stat-trend">
              <span className="text-secondary">-</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper red">
            <RotateCcw size={24} />
          </div>
          <div className="stat-info">
            <h3>{t('dashboard.returns_processed')}</h3>
            <div className="stat-value">28 <span className="stat-unit">{t('dashboard.unit_cases')}</span></div>
            <div className="stat-trend negative">
              <TrendingUp size={14} className="rotate-180" /> <span>5% {t('dashboard.trend_increase')} {t('dashboard.trend_vs_last_week')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-main-content">
        <div className="card-panel recent-activity">
          <div className="panel-header">
            <h2>{t('dashboard.recent_activity')}</h2>
            <button className="btn-text">{t('dashboard.view_all')}</button>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <CheckCircle2 size={20} className="text-success" />
              <div className="activity-content">
                <p className="activity-desc">
                  {t('dashboard.activity_shipment_complete', { id: 'ORD-8821' })}
                </p>
                <span className="activity-time">{t('dashboard.activity_time_10m')}</span>
              </div>
            </div>
            <div className="activity-item">
              <AlertCircle size={20} className="text-warning" />
              <div className="activity-content">
                <p className="activity-desc">
                  {t('dashboard.activity_stock_alert', { name: 'A' })}
                </p>
                <span className="activity-time">{t('dashboard.activity_time_35m')}</span>
              </div>
            </div>
            <div className="activity-item">
              <Truck size={20} className="text-primary" />
              <div className="activity-content">
                <p className="activity-desc">
                  {t('dashboard.activity_vehicle_registered', { id: 'ID-593' })}
                </p>
                <span className="activity-time">{t('dashboard.activity_time_1h')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-panel quick-actions">
          <div className="panel-header">
            <h2>{t('dashboard.quick_action')}</h2>
          </div>
          <div className="actions-grid">
            <button className="action-btn" onClick={callHealthApi}>
              <div className="icon-container"><TrendingUp size={24} /></div>
              <span>{t('dashboard.api_health_check')}</span>
            </button>
            <button className="action-btn outline">
              <div className="icon-container"><Package size={24} /></div>
              <span>{t('dashboard.register_new_order')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
