'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { Layout, MessageSquare, RefreshCcw, Server, Activity, Filter, AlertCircle } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Bar
} from 'recharts';
import './SystemMonitoring.css';

interface InstanceInfo {
  id: string;
  status: string;
  cpu: number;
  memory: number;
}

interface ServerStats {
  name?: string;
  cpu: number;
  memory: number;
  status: string;
  latency?: number;
  tps?: number;
  errorRate?: number;
  instances?: InstanceInfo[];
}

interface SystemSummary {
  sysBackend: ServerStats;
  authServer: ServerStats;
  batchServer: ServerStats;
  dbServer: ServerStats;
  traceCount?: number;
  traceAvgDuration?: number;
  traceMaxMemory?: number;
  timestamp: string;
}

interface SystemLog {
  id: number;
  timestamp: string;
  level: string;
  message: string;
}

interface ExecutionTrace {
  id: string;
  timestamp: string;
  appId: string;
  serviceName: string;
  methodName: string;
  duration: number;
  usedMemory: number;
  totalMemory: number;
  query: string;
  status: string;
}

interface ChartPoint {
  time: string;
  timestamp: number;
  sysLatency: number | undefined;
  authLatency: number | undefined;
  batchLatency: number | undefined;
  dbLatency: number | undefined;
  sysTps: number | undefined;
  authTps: number | undefined;
  batchTps: number | undefined;
  dbTps: number | undefined;
  sysCpu: number | undefined;
  authCpu: number | undefined;
  batchCpu: number | undefined;
  dbCpu: number | undefined;
  sysMem: number | undefined;
  authMem: number | undefined;
  batchMem: number | undefined;
  dbMem: number | undefined;
  traceCount?: number;
  traceAvgDuration?: number;
  traceMaxMemory?: number;
}
const ProgressFill = ({ progress }: { progress: number }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.style.width = `${Math.min(100, progress)}%`;
    }
  }, [progress]);
  return <div ref={ref} className="progress-fill" />;
};

const transformSnapshotToChartPoint = (snapshot: SystemSummary): ChartPoint => {
  const date = new Date(snapshot.timestamp);
  const label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  return {
    time: label,
    timestamp: date.getTime(),
    sysLatency: snapshot.sysBackend.latency,
    authLatency: snapshot.authServer.latency,
    batchLatency: snapshot.batchServer.latency,
    dbLatency: snapshot.dbServer.latency,
    sysTps: snapshot.sysBackend.tps,
    authTps: snapshot.authServer.tps,
    batchTps: snapshot.batchServer.tps,
    dbTps: snapshot.dbServer.tps,
    sysCpu: snapshot.sysBackend.cpu,
    authCpu: snapshot.authServer.cpu,
    batchCpu: snapshot.batchServer.cpu,
    dbCpu: snapshot.dbServer.cpu,
    sysMem: snapshot.sysBackend.memory,
    authMem: snapshot.authServer.memory,
    batchMem: snapshot.batchServer.memory,
    dbMem: snapshot.dbServer.memory,
    traceCount: snapshot.traceCount,
    traceAvgDuration: snapshot.traceAvgDuration,
    traceMaxMemory: snapshot.traceMaxMemory,
  };
};

export default function SystemMonitoringPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedServer, setSelectedServer] = useState<'all' | 'sys-backend' | 'batch-server' | 'auth-server' | 'database'>('all');
  
  const [summary, setSummary] = useState<SystemSummary | null>(null);
  const [history, setHistory] = useState<ChartPoint[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionTrace[]>([]);
  const [executionLogFilter, setExecutionLogFilter] = useState<string>('All');
  const [traceAppFilter, setTraceAppFilter] = useState<string>('sys-backend');
  const [traceHourFilter, setTraceHourFilter] = useState<string>(new Date().getHours().toString().padStart(2, '0'));
  const [tracePage, setTracePage] = useState<number>(1);

  const [loading, setLoading] = useState(true);

  const uniqueApps = Array.from(new Set(executionLogs.map(log => log.appId))).filter(Boolean);
  const filteredExecutionLogs = executionLogFilter === 'All' 
    ? executionLogs 
    : executionLogs.filter(log => log.appId === executionLogFilter);

  const traceTableData = executionLogs.filter(log => {
    // App Filter
    if (traceAppFilter !== 'All' && log.appId !== traceAppFilter) return false;
    // Hour Filter
    const h = new Date(log.timestamp).getHours();
    return h.toString().padStart(2, '0') === traceHourFilter;
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(traceTableData.length / ITEMS_PER_PAGE);
  const currentTableData = traceTableData.slice((tracePage - 1) * ITEMS_PER_PAGE, tracePage * ITEMS_PER_PAGE);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setTracePage(1);
  }, [traceAppFilter, traceHourFilter, executionLogs]);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayTime = startOfDay.getTime();
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const endOfDayTime = endOfDay.getTime();

  const todayHistory = history.filter(h => h.timestamp >= startOfDayTime);

  // Aggregate by hour for the chart
  const hourlyData: Record<string, string | number>[] = [];
  for (let h = 0; h <= 24; h++) {
    const timeLabel = `${h.toString().padStart(2, '0')}:00`;
    const slot: Record<string, string | number> = { timeLabel };
    uniqueApps.forEach(app => {
       slot[`${app}_memory`] = 0;
       slot[`${app}_duration`] = 0;
    });
    hourlyData.push(slot);
  }

  filteredExecutionLogs.forEach(log => {
    const logTime = new Date(log.timestamp).getTime();
    const h = Math.floor((logTime - startOfDayTime) / 3600000);
    if (h >= 0 && h <= 24) {
      (hourlyData[h] as Record<string, number>)[`${log.appId}_memory`] = ((hourlyData[h] as Record<string, number>)[`${log.appId}_memory`] || 0) + log.usedMemory;
      (hourlyData[h] as Record<string, number>)[`${log.appId}_duration`] = ((hourlyData[h] as Record<string, number>)[`${log.appId}_duration`] || 0) + log.duration;
    }
  });

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const appAggregations = executionLogs.reduce((acc, log) => {
    const key = log.appId || 'Unknown';
    if (!acc[key]) {
      acc[key] = { appId: key, totalMemory: 0, totalDuration: 0, count: 0 };
    }
    acc[key].totalMemory += log.usedMemory;
    acc[key].totalDuration += log.duration;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { appId: string, totalMemory: number, totalDuration: number, count: number }>);
  const appAggList = Object.values(appAggregations);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await apiClient.get<SystemSummary>('/api/v1/system/monitoring/summary');
      setSummary(data);
      
      setHistory(prev => {
        const newPoint = transformSnapshotToChartPoint(data);
        let updated = [...prev];
        
        // Handle gap between last point and new point
        if (updated.length > 0) {
          const lastPoint = updated[updated.length - 1];
          if (newPoint.timestamp - lastPoint.timestamp > 5 * 60 * 1000) {
            updated.push({
              ...newPoint,
              time: '',
              timestamp: lastPoint.timestamp + 60000,
              sysLatency: undefined,
              authLatency: undefined,
              batchLatency: undefined,
              dbLatency: undefined,
              sysTps: undefined,
              authTps: undefined,
              batchTps: undefined,
              dbTps: undefined,
              sysCpu: undefined,
              authCpu: undefined,
              batchCpu: undefined,
              dbCpu: undefined,
              sysMem: undefined,
              authMem: undefined,
              batchMem: undefined,
              dbMem: undefined,
            });
          }
        }
        
        updated.push(newPoint);
        // Keep only last 1440 minutes (24h) - roughly, including possible null points
        if (updated.length > 2000) { 
          updated = updated.slice(updated.length - 2000);
        }
        return updated;
      });
    } catch (e) {
      console.error('Failed to fetch monitoring summary', e);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await apiClient.get<SystemSummary[]>('/api/v1/system/monitoring/history');
      if (data && data.length > 0) {
        const transformed = data.map(transformSnapshotToChartPoint);
        
        // Handle gaps (if gap > 5 minutes, insert a null point to break the line)
        const withGaps: ChartPoint[] = [];
        for (let i = 0; i < transformed.length; i++) {
          if (i > 0) {
            const gap = transformed[i].timestamp - transformed[i-1].timestamp;
            if (gap > 5 * 60 * 1000) { // 5 minutes
              withGaps.push({
                time: '',
                timestamp: transformed[i-1].timestamp + 60000,
                sysLatency: undefined,
                authLatency: undefined,
                batchLatency: undefined,
                dbLatency: undefined,
                sysTps: undefined,
                authTps: undefined,
                batchTps: undefined,
                dbTps: undefined,
                sysCpu: undefined,
                authCpu: undefined,
                batchCpu: undefined,
                dbCpu: undefined,
                sysMem: undefined,
                authMem: undefined,
                batchMem: undefined,
                dbMem: undefined,
              });
            }
          }
          withGaps.push(transformed[i]);
        }
        setHistory(withGaps);
      }
    } catch (e) {
      console.error('Failed to fetch monitoring history', e);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await apiClient.get<SystemLog[]>('/api/v1/system/monitoring/logs');
      setLogs(data);
    } catch (e) {
      console.error('Failed to fetch system logs', e);
    }
  };

  const fetchExecutionLogs = async () => {
    try {
      const data = await apiClient.get<ExecutionTrace[]>('/api/v1/system/monitoring/execution-logs');
      setExecutionLogs(data);
    } catch (e) {
      console.error('Failed to fetch execution logs', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchLogs(), fetchHistory(), fetchExecutionLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderServerCard = (id: string, stats: ServerStats | undefined, iconColor: string = 'text-primary') => {
    if (!stats) return null;
    
    return (
      <Card key={id} title={
        <div className="flex items-center gap-8">
          <Server size={18} className={iconColor} />
          <span>{stats.name || id.toUpperCase()}</span>
          <span className={`status-badge ${stats.status === 'Healthy' ? 'success' : 'danger'}`}>
            {stats.status}
          </span>
        </div>
      }>
        <div className="card-stat-grid">
          <div className="stat-card large">
            <div className="stat-label">Latency (ms)</div>
            <div className="stat-value text-accent-blue">{stats.latency?.toFixed(0) ?? '--'}</div>
          </div>
          <div className="stat-card large">
            <div className="stat-label">TPS</div>
            <div className="stat-value text-accent-blue">{stats.tps?.toFixed(1) ?? '--'}</div>
          </div>
          <div className="stat-card large">
            <div className="stat-label">CPU (%)</div>
            <div className="stat-value text-accent-blue">{stats.cpu.toFixed(1)}%</div>
          </div>
          <div className="stat-card large">
            <div className="stat-label">Memory (%)</div>
            <div className="stat-value text-accent-blue">{stats.memory}%</div>
          </div>
        </div>

        {stats.instances && stats.instances.length > 0 && (
          <div className="instance-list-area mt-4">
            <div className="stat-label mb-2 flex items-center gap-4">
              <Activity size={14} className="text-tertiary" /> {t('monitoring.active_instances', '가동 인스턴스')} ({stats.instances.length})
            </div>
            <div className="flex flex-wrap gap-4">
              {stats.instances.map(inst => (
                <div key={inst.id} className="instance-chip" title={`CPU: ${inst.cpu.toFixed(1)}%, Mem: ${inst.memory}%`}>
                  <div className={`status-dot ${inst.status === 'Healthy' ? 'bg-success' : 'bg-danger'}`}></div>
                  <span className="instance-id">{inst.id.split('-').pop()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  };

  const renderChart = (title: string, subtitle: string, keys: (keyof ChartPoint)[], unit: string = '', max?: number) => (
    <div>
      <h4 className="text-center text-sm mb-8">{subtitle}</h4>
      {isMounted && (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={todayHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis 
              dataKey="timestamp" 
              fontSize={10} 
              type="number" 
              domain={[startOfDayTime, endOfDayTime]} 
              ticks={[
                startOfDayTime,
                startOfDayTime + 3 * 3600000,
                startOfDayTime + 6 * 3600000,
                startOfDayTime + 9 * 3600000,
                startOfDayTime + 12 * 3600000,
                startOfDayTime + 15 * 3600000,
                startOfDayTime + 18 * 3600000,
                startOfDayTime + 21 * 3600000,
                endOfDayTime
              ]}
              tickFormatter={(v) => {
                const date = new Date(v);
                return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
              }}
            />
            <YAxis fontSize={10} domain={max ? [0, max] : undefined} unit={unit} />
            <Tooltip 
              contentStyle={{ fontSize: '10px' }} 
              labelFormatter={(v) => {
                const date = new Date(v);
                return `${date.toLocaleDateString()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            {(selectedServer === 'all' || selectedServer === 'sys-backend') && <Line type="monotone" dataKey={keys[0]} name="Backend" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />}
            {(selectedServer === 'all' || selectedServer === 'auth-server') && <Line type="monotone" dataKey={keys[1]} name="Auth" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />}
            {(selectedServer === 'all' || selectedServer === 'batch-server') && <Line type="monotone" dataKey={keys[2]} name="Batch" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />}
            {(selectedServer === 'all' || selectedServer === 'database') && <Line type="monotone" dataKey={keys[3]} name="Database" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  return (
    <div className="template-page fade-in p-6">
      <div className="flex justify-between items-center mb-6">
        <PageHeader 
          title={t('sidebar.system_monitoring', '시스템 모니터링')} 
          description="주요 서버별 실시간 성능 추이 및 4대 황금 신호(Golden Signals)를 분석합니다."
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
            <Layout size={18} /> {t('monitoring.dashboard_summary', '대시보드 요약')}
          </button>
          <button 
            className={`tab-item ${activeTab === 'execution' ? 'active' : ''}`}
            onClick={() => setActiveTab('execution')}
          >
            <Activity size={18} /> {t('monitoring.execution_trace', '실행 로그 (Trace)')}
          </button>
          <button 
            className={`tab-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <MessageSquare size={18} /> {t('monitoring.system_logs', '시스템 로그')}
          </button>
        </div>

        {activeTab === 'summary' && (
            <div className="tab-content-area mt-4 pb-48">
              {loading && !summary ? (
                <div className="empty-state">
                  <RefreshCcw size={48} className="animate-spin mb-16 opacity-20" />
                  <p>데이터를 불러오는 중입니다...</p>
                </div>
              ) : summary ? (
                <div className="fade-in">
                  <Card title={
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-8">
                        <Activity size={18} className="text-primary" />
                        <span>주요 성능 지표 트렌드 (Golden Signals)</span>
                      </div>
                      <div className="flex gap-4">
                        {[
                          { id: 'all', label: '전체' },
                          { id: 'sys-backend', label: 'Backend' },
                          { id: 'auth-server', label: 'Auth' },
                          { id: 'batch-server', label: 'Batch' },
                          { id: 'database', label: 'Database' }
                        ].map(srv => (
                          <button
                            key={srv.id}
                            onClick={() => setSelectedServer(srv.id as 'all' | 'sys-backend' | 'batch-server' | 'auth-server' | 'database')}
                            className={`filter-btn ${selectedServer === srv.id ? 'active' : ''}`}
                          >
                            {srv.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  }>
                    <div className="trend-charts-container">
                      {renderChart('CPU Usage (%)', 'CPU 사용률 추이', ['sysCpu', 'authCpu', 'batchCpu', 'dbCpu'], '%', 100)}
                      {renderChart('Memory Usage (%)', '메모리 점유율 추이', ['sysMem', 'authMem', 'batchMem', 'dbMem'], '%', 100)}
                      {renderChart('Response Time (ms)', '응답 시간(Latency) 추이', ['sysLatency', 'authLatency', 'batchLatency', 'dbLatency'], 'ms')}
                      {renderChart('Request Rate (TPS)', '트래픽(TPS) 추이', ['sysTps', 'authTps', 'batchTps', 'dbTps'], 'tps')}
                    </div>
                  </Card>

                  <div className="flex justify-between items-center mt-24 mb-16">
                    <h3 className="tab-content-title">시스템 리소스 정보 (실시간)</h3>
                    <span className="text-xs text-tertiary">수집 시각: {new Date(summary.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="summary-grid">
                    {renderServerCard('sysBackend', summary.sysBackend, 'chart-text-backend')}
                    {renderServerCard('authServer', summary.authServer, 'chart-text-auth')}
                    {renderServerCard('batchServer', summary.batchServer, 'chart-text-batch')}
                    {renderServerCard('dbServer', summary.dbServer, 'chart-text-db')}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <AlertCircle size={48} className="mb-16 opacity-20" />
                  <p>데이터를 불러오지 못했습니다. 서버 상태나 로그인 세션을 확인해주세요.</p>
                  <button className="btn btn-primary mt-16" onClick={loadData}>새로고침 시도</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'execution' && (
            <div className="fade-in text-secondary flex flex-col gap-24">

              <Card title="App별 누적 실행 지표">
                <div className="service-summary-grid">
                  {appAggList.map(agg => {
                    const isBackend = agg.appId === 'sys-backend';
                    return (
                      <div key={agg.appId} className={`stat-card ${isBackend ? 'primary' : ''}`}>
                        <div className="card-header">
                          <div className="icon-placeholder">
                            {isBackend ? <Server size={20} /> : <Activity size={20} />}
                          </div>
                          <div className="card-title-text">{agg.appId}</div>
                        </div>
                        
                        <div className="metric-row">
                          <span className="metric-label">Total Memory</span>
                          <div className="metric-value-container">
                            <span className="metric-value">{agg.totalMemory.toFixed(0)}</span>
                            <span className="metric-unit">MB</span>
                          </div>
                        </div>
                        <div className="metric-row">
                          <span className="metric-label">Total Duration</span>
                          <div className="metric-value-container">
                            <span className="metric-value accent">{agg.totalDuration}</span>
                            <span className="metric-unit">ms</span>
                          </div>
                        </div>
                        <div className="metric-row">
                          <span className="metric-label">Trace Count</span>
                          <div className="metric-value-container">
                            <span className="metric-value accent">{agg.count}</span>
                            <span className="metric-unit">traces</span>
                          </div>
                        </div>
                        
                        <div className="footer-info">
                          Calculated from latest {agg.count} traces
                        </div>
                      </div>
                    );
                  })}
                  {appAggList.length === 0 && (
                    <div className="col-span-full text-center text-tertiary p-16">데이터가 없습니다.</div>
                  )}
                </div>
              </Card>

               <div className="filter-bar">
                <div className="filter-group">
                  <div className="text-xs font-bold text-secondary flex items-center gap-4">
                    <Filter size={14} /> App 필터:
                  </div>
                  <div className="flex gap-8">
                    {['All', ...uniqueApps].map(app => (
                      <button
                        key={app}
                        onClick={() => setExecutionLogFilter(app)}
                        className={`filter-btn ${executionLogFilter === app ? 'active' : ''}`}
                      >
                        {app === 'All' ? '전체 App' : app}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Card title="서비스 실행 성능 트렌드 (금일 00시 ~ 24시, 시간당 누계)">
                <div className="trace-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis 
                        dataKey="timeLabel" 
                        interval={3}
                        fontSize={10} 
                      />
                      <YAxis yAxisId="left" fontSize={10} label={{ value: 'Total Mem (MB)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" fontSize={10} label={{ value: 'Total Duration (ms)', angle: 90, position: 'insideRight', fontSize: 10 }} />
                      <Tooltip labelFormatter={(label) => `${label} ~`} />
                      <Legend />
                      {uniqueApps.map((app, idx) => (
                        <Bar 
                          key={`bar-${app}`} 
                          yAxisId="right" 
                          dataKey={`${app}_duration`} 
                          name={`${app} Duration`} 
                          stackId="duration" 
                          fill={CHART_COLORS[idx % CHART_COLORS.length]} 
                          opacity={0.8} 
                          barSize={12} 
                        />
                      ))}
                      {uniqueApps.map((app, idx) => (
                        <Line 
                          key={`line-${app}`} 
                          yAxisId="left" 
                          type="monotone" 
                          dataKey={`${app}_memory`} 
                          name={`${app} Memory`} 
                          stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                        />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title={
                <div className="flex justify-between items-center w-full">
                  <span>App 실행 상세 트레이스 내역</span>
                  <div className="flex gap-8">
                    <select 
                      className="form-select text-sm p-4 rounded-4 border-gray-200"
                      value={traceAppFilter}
                      onChange={(e) => setTraceAppFilter(e.target.value)}
                      title="App Filter"
                      aria-label="Filter by app"
                    >
                      {uniqueApps.map(app => (
                        <option key={app} value={app}>{app}</option>
                      ))}
                    </select>
                    <select 
                      className="form-select text-sm p-4 rounded-4 border-gray-200"
                      value={traceHourFilter}
                      onChange={(e) => setTraceHourFilter(e.target.value)}
                      title="Hour Filter"
                      aria-label="Filter by hour"
                    >
                      {Array.from({ length: 24 }).map((_, i) => {
                        const hourStr = i.toString().padStart(2, '0');
                        return <option key={hourStr} value={hourStr}>{hourStr}시 ~ {(i+1).toString().padStart(2, '0')}시</option>;
                      })}
                    </select>
                  </div>
                </div>
              }>
                <div className="overflow-x-auto">
                  <table className="trace-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>App / Method</th>
                        <th className="text-right">Duration</th>
                        <th className="text-right">Memory (Used/Total)</th>
                        <th>SQL Query / Note</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTableData.map(log => {
                        const logDate = new Date(log.timestamp);
                        const timeStr = isNaN(logDate.getTime()) ? 'Invalid' : logDate.toLocaleTimeString();
                        return (
                          <tr key={log.id}>
                            <td className="text-xs text-tertiary">{timeStr}</td>
                          <td>
                            <div className="font-semibold text-primary">{log.appId || log.serviceName}</div>
                            <div className="text-xs text-tertiary">{log.methodName}</div>
                          </td>
                          <td className="text-right">
                            <span className={`status-badge ${log.duration > 300 ? 'danger' : 'success'}`}>
                              {log.duration}ms
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="font-mono text-xs">
                              <span className="text-primary">{log.usedMemory.toFixed(0)}MB</span> / <span className="text-tertiary">{log.totalMemory.toFixed(0)}MB</span>
                            </div>
                            <div className="progress-container">
                              <ProgressFill progress={(log.usedMemory / log.totalMemory) * 100} />
                            </div>
                          </td>
                          <td>
                            <div className="query-cell" title={log.query}>
                              {log.query}
                            </div>
                          </td>
                          <td className="text-center">
                             <span className={`status-badge ${log.status === 'Success' ? 'success' : 'danger'}`}>
                                {log.status}
                             </span>
                          </td>
                        </tr>
                      );
                    })}
                      {currentTableData.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center text-tertiary py-32">조건에 맞는 수집된 실행 로그가 없습니다.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="pagination-bar">
                  <span className="text-xs text-tertiary">
                    총 <span className="font-semibold">{traceTableData.length}</span>건 중 {(tracePage - 1) * ITEMS_PER_PAGE + (traceTableData.length > 0 ? 1 : 0)} ~ {Math.min(tracePage * ITEMS_PER_PAGE, traceTableData.length)}건 표시
                  </span>
                  <div className="page-controls">
                    <button 
                      className="page-btn" 
                      disabled={tracePage <= 1} 
                      onClick={() => setTracePage(p => p - 1)}
                    >
                      이전
                    </button>
                    <span className="page-info">{tracePage} / {Math.max(1, totalPages)}</span>
                    <button 
                      className="page-btn" 
                      disabled={tracePage >= Math.max(1, totalPages)} 
                      onClick={() => setTracePage(p => p + 1)}
                    >
                      다음
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="tab-content-area mt-4">
              <Card title="시스템 에러 로그 및 이벤트">
                <div className="log-viewer">
                  {loading && logs.length === 0 ? (
                    <div className="empty-state">로그를 불러오는 중...</div>
                  ) : logs.length > 0 ? (
                    logs.map(log => (
                      <div key={log.id} className="log-entry">
                        <span className="log-timestamp">[{new Date(log.timestamp).toLocaleString()}]</span>
                        <span className={`log-level ${log.level}`}>{log.level}</span>
                        <span className="log-message">{log.message}</span>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">조회된 로그가 없습니다.</div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
}
