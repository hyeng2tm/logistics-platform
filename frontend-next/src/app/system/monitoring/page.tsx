'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { Layout, MessageSquare, RefreshCcw, Server } from 'lucide-react';
import './SystemMonitoring.css';

interface SystemSummary {
  systemLoad: number;
  memoryUsage: number;
  timestamp: string;
}

interface SystemLog {
  id: number;
  timestamp: string;
  level: string;
  message: string;
}

export default function SystemMonitoringPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('summary');
  
  const [summary, setSummary] = useState<SystemSummary | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/v1/system/monitoring/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {
      console.error('Failed to fetch monitoring summary', e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/v1/system/monitoring/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error('Failed to fetch system logs', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line
    loadData();
    // Refresh every 30 seconds
    // eslint-disable-next-line
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="template-page fade-in p-6">
      <div className="flex justify-between items-center mb-6">
        <PageHeader 
          title={t('sidebar.system_monitoring', '시스템 모니터링')} 
          description="실시간 시스템 상태 및 이벤트를 확인합니다."
          breadcrumbs={[t('sidebar.system_management', '시스템 관리'), t('sidebar.system_monitoring', '시스템 모니터링')]}
        />
        <button className="btn btn-outline flex items-center gap-8" onClick={loadData} disabled={loading}>
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> {t('common.refresh', '새로고침')}
        </button>
      </div>

      <div className="system-monitoring-container mt-6">
        <div className="tab-menu-bar">
          <button 
            className={`tab-item ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            <Layout size={18} /> 시스템 현황
          </button>
          <button 
            className={`tab-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <MessageSquare size={18} /> 시스템 로그
          </button>
        </div>

        <div className="tab-content-area mt-4">
          {activeTab === 'summary' && (
            <div className="fade-in text-secondary">
              <Card title={
                <div className="flex items-center gap-8">
                  <Server size={18} className="text-primary" />
                  <span>서버 리소스 상태</span>
                  {summary && <span className="text-xs text-tertiary ml-8 font-normal">Last updated: {new Date(summary.timestamp).toLocaleTimeString()}</span>}
                </div>
              }>
                {loading && !summary ? (
                  <div className="p-16 text-center text-tertiary">로딩 중...</div>
                ) : summary ? (
                  <div className="summary-grid mb-16">
                    <div className="stat-card">
                      <div className="stat-label">CPU Load Average</div>
                      <div className="stat-value">{summary.systemLoad.toFixed(2)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Memory Usage</div>
                      <div className="stat-value">{summary.memoryUsage}%</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-16 text-center text-danger">데이터를 불러오지 못했습니다.</div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="fade-in text-secondary flex flex-col gap-16">
              <Card title="시스템 에러 로그 및 이벤트">
                {loading && logs.length === 0 ? (
                  <div className="p-16 text-center text-tertiary">로그를 불러오는 중...</div>
                ) : (
                  <div className="log-viewer">
                    {logs.map(log => (
                      <div key={log.id} className="log-entry">
                        <span className="log-timestamp">[{new Date(log.timestamp).toLocaleString()}]</span>
                        <span className={`log-level ${log.level}`}>{log.level}</span>
                        <span className="log-message">{log.message}</span>
                      </div>
                    ))}
                    {logs.length === 0 && <div className="text-center text-tertiary p-16">조회된 로그가 없습니다.</div>}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
