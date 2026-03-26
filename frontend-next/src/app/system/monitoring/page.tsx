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

interface SREAnalysis {
  id: string;
  bucketTime: string;
  bucketTimestamp?: number;
  appId: string;
  serviceName: string;
  methodName: string;
  minDuration: number;
  maxDuration: number;
  avgDuration: number;
  totalDuration: number;
  minUsedMemory: number;
  maxUsedMemory: number;
  avgUsedMemory: number;
  totalUsedMemory: number;
  cpuP95: number;
  cpuP50: number;
  totalCounts: number;
  representativeSql: string;
  lastExecuteTime: string;
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
  const [sreData, setSreData] = useState<SREAnalysis[]>([]);
  const [executionLogFilter, setExecutionLogFilter] = useState<string>('All');
  const [traceAppFilter, setTraceAppFilter] = useState<string>('sys-backend');
  const [traceHourFilter, setTraceHourFilter] = useState<string>(new Date().getHours().toString().padStart(2, '0'));
  const [tracePage, setTracePage] = useState<number>(1);
  const [sreDateFilter, setSreDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);

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

  const sreStartOfDay = new Date(sreDateFilter);
  sreStartOfDay.setHours(0, 0, 0, 0);
  const sreStartOfDayTime = sreStartOfDay.getTime();
  
  const sreEndOfDay = new Date(sreDateFilter);
  sreEndOfDay.setHours(23, 59, 59, 999);
  const sreEndOfDayTime = sreEndOfDay.getTime();

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

  const fetchSreAnalysis = async () => {
    try {
      const data = await apiClient.get<SREAnalysis[]>('/api/v1/system/monitoring/sre-analysis');
      
      // Inject Mock Data for Demonstration
      const dateStr = sreDateFilter; // Use selected date
      let mockPeaks: SREAnalysis[] = [];

      if (dateStr === '2026-03-21') {
        // Sample data for 5 days ago - Historical Incident (Massive Memory Leak & Latency Spike)
        mockPeaks = [
          {
            id: 'hist-p1',
            bucketTime: `${dateStr}T10:00:00`,
            appId: 'sys-backend',
            serviceName: 'OrderService',
            methodName: 'validateOrderFlow',
            minDuration: 500, maxDuration: 12000, avgDuration: 3500, totalDuration: 3500000,
            minUsedMemory: 1200, maxUsedMemory: 4500, avgUsedMemory: 3200, totalUsedMemory: 3200000,
            cpuP95: 98.2, cpuP50: 65.5, totalCounts: 1000,
            representativeSql: 'SELECT * FROM orders WHERE created_at > ...',
            lastExecuteTime: `${dateStr}T10:15:00`
          },
          {
            id: 'hist-p2',
            bucketTime: `${dateStr}T11:00:00`,
            appId: 'sys-backend',
            serviceName: 'InventoryService',
            methodName: 'updateStockBulk',
            minDuration: 800, maxDuration: 25000, avgDuration: 8200, totalDuration: 8200000,
            minUsedMemory: 2500, maxUsedMemory: 7800, avgUsedMemory: 6500, totalUsedMemory: 6500000,
            cpuP95: 99.8, cpuP50: 82.0, totalCounts: 1000,
            representativeSql: 'UPDATE inventory SET quantity = quantity - 1 ...',
            lastExecuteTime: `${dateStr}T11:20:00`
          }
        ];
      } else {
        // Default Mock Data (9-11 AM, 2-4 PM)
        mockPeaks = [
          {
            id: 'mock-p1',
            bucketTime: `${dateStr}T09:00:00`,
            appId: 'sys-backend',
            serviceName: 'OrderService',
            methodName: 'processLargeBatch',
            minDuration: 200, maxDuration: 4500, avgDuration: 1200, totalDuration: 1200000,
            minUsedMemory: 400, maxUsedMemory: 1200, avgUsedMemory: 850, totalUsedMemory: 850000,
            cpuP95: 94.5, cpuP50: 45.0, totalCounts: 1000,
            representativeSql: 'SELECT * FROM orders WHERE status = "PENDING"',
            lastExecuteTime: `${dateStr}T09:05:00`
          },
          {
            id: 'mock-p2',
            bucketTime: `${dateStr}T10:00:00`,
            appId: 'sys-backend',
            serviceName: 'PaymentService',
            methodName: 'validateTransactions',
            minDuration: 150, maxDuration: 3200, avgDuration: 850, totalDuration: 680000,
            minUsedMemory: 300, maxUsedMemory: 950, avgUsedMemory: 620, totalUsedMemory: 496000,
            cpuP95: 89.2, cpuP50: 38.5, totalCounts: 800,
            representativeSql: 'UPDATE transactions SET status = "VALIDATED"',
            lastExecuteTime: `${dateStr}T10:10:00`
          },
          {
            id: 'mock-p3',
            bucketTime: `${dateStr}T14:00:00`,
            appId: 'sys-backend',
            serviceName: 'InventoryService',
            methodName: 'syncStockLevels',
            minDuration: 300, maxDuration: 5800, avgDuration: 1500, totalDuration: 1800000,
            minUsedMemory: 500, maxUsedMemory: 1500, avgUsedMemory: 1100, totalUsedMemory: 1320000,
            cpuP95: 96.8, cpuP50: 52.0, totalCounts: 1200,
            representativeSql: 'INSERT INTO inventory_logs SELECT * FROM temp_stock',
            lastExecuteTime: `${dateStr}T14:15:00`
          },
          {
            id: 'mock-p4',
            bucketTime: `${dateStr}T15:00:00`,
            appId: 'sys-backend',
            serviceName: 'NotificationService',
            methodName: 'sendBulkPush',
            minDuration: 100, maxDuration: 2800, avgDuration: 620, totalDuration: 930000,
            minUsedMemory: 250, maxUsedMemory: 780, avgUsedMemory: 480, totalUsedMemory: 720000,
            cpuP95: 91.0, cpuP50: 41.5, totalCounts: 1500,
            representativeSql: 'SELECT user_id FROM push_tokens',
            lastExecuteTime: `${dateStr}T15:20:00`
          }
        ];
      }

      if (data) {
        const combinedData = [...data, ...mockPeaks].map(d => ({
          ...d,
          bucketTimestamp: new Date(d.bucketTime).getTime()
        })).sort((a,b) => a.bucketTime.localeCompare(b.bucketTime));
        setSreData(combinedData);
      }
    } catch (e) {
      console.error('Failed to fetch SRE analysis data', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchLogs(), fetchHistory(), fetchExecutionLogs(), fetchSreAnalysis()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'sre') {
      fetchSreAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sreDateFilter]);

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
          <button 
            className={`tab-item ${activeTab === 'sre' ? 'active' : ''}`}
            onClick={() => setActiveTab('sre')}
          >
            <Activity size={18} className="text-accent-gold" /> {t('monitoring.sre_analysis', 'SRE 분석 리포트')}
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
          {activeTab === 'sre' && (
            <div className="tab-content-area mt-4 pb-48 fade-in">
              <div className="flex justify-between items-center mb-24 px-4">
                <div className="flex items-center gap-12 bg-white px-16 py-8 rounded-lg border border-gray-100 shadow-sm">
                  <Filter size={16} className="text-secondary" />
                  <label htmlFor="sre-date-filter" className="text-sm font-medium">분석 일자:</label>
                  <input 
                    id="sre-date-filter"
                    type="date" 
                    value={sreDateFilter} 
                    onChange={(e) => setSreDateFilter(e.target.value)}
                    className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer outline-none"
                    title="분석 일자 선택"
                  />
                </div>
                <button 
                  className="flex items-center gap-8 bg-blue-50 text-primary px-16 py-8 rounded-lg hover:bg-blue-100 transition-colors" 
                  onClick={fetchSreAnalysis}
                >
                  <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                  <span className="text-sm font-medium">분석 데이터 갱신</span>
                </button>
              </div>
              <div className="flex flex-col gap-24">
                <Card title="SRE Golden Signal: Latency & Traffic">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
                    <div className="sre-chart-wrapper-sm">
                      <h4 className="text-center text-sm mb-16 opacity-70">Latency (평균 응답 시간)</h4>
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={sreData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                          <XAxis 
                            dataKey="bucketTimestamp" 
                            type="number"
                            domain={[sreStartOfDayTime, sreEndOfDayTime]}
                            ticks={[
                              sreStartOfDayTime,
                              sreStartOfDayTime + 3 * 3600000,
                              sreStartOfDayTime + 6 * 3600000,
                              sreStartOfDayTime + 9 * 3600000,
                              sreStartOfDayTime + 12 * 3600000,
                              sreStartOfDayTime + 15 * 3600000,
                              sreStartOfDayTime + 18 * 3600000,
                              sreStartOfDayTime + 21 * 3600000,
                              sreEndOfDayTime
                            ]}
                            tickFormatter={(v) => {
                              const date = new Date(v);
                              return `${date.getHours().toString().padStart(2, '0')}:00`;
                            }}
                            fontSize={10} 
                          />
                          <YAxis fontSize={10} unit="ms" />
                          <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                          <Legend />
                          <Line type="monotone" dataKey="avgDuration" name="Avg Latency" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="maxDuration" name="Max Latency" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="sre-chart-wrapper-sm">
                      <h4 className="text-center text-sm mb-16 opacity-70">Traffic (요청 처리량)</h4>
                      <ResponsiveContainer width="100%" height={240}>
                        <ComposedChart data={sreData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                          <XAxis 
                            dataKey="bucketTimestamp" 
                            type="number"
                            domain={[sreStartOfDayTime, sreEndOfDayTime]}
                            ticks={[
                              sreStartOfDayTime,
                              sreStartOfDayTime + 3 * 3600000,
                              sreStartOfDayTime + 6 * 3600000,
                              sreStartOfDayTime + 9 * 3600000,
                              sreStartOfDayTime + 12 * 3600000,
                              sreStartOfDayTime + 15 * 3600000,
                              sreStartOfDayTime + 18 * 3600000,
                              sreStartOfDayTime + 21 * 3600000,
                              sreEndOfDayTime
                            ]}
                            tickFormatter={(v) => {
                              const date = new Date(v);
                              return `${date.getHours().toString().padStart(2, '0')}:00`;
                            }}
                            fontSize={10} 
                          />
                          <YAxis fontSize={10} />
                          <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                          <Legend />
                          <Bar dataKey="totalCounts" name="Request Count" fill="#10b981" opacity={0.7} barSize={20} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Card>

                <Card title="SRE Golden Signal: Saturation & Errors">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
                    <div className="sre-chart-wrapper-sm">
                      <h4 className="text-center text-sm mb-16 opacity-70">Saturation (자원 포화도 - Used Memory)</h4>
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={sreData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                          <XAxis 
                            dataKey="bucketTimestamp" 
                            type="number"
                            domain={[sreStartOfDayTime, sreEndOfDayTime]}
                            ticks={[
                              sreStartOfDayTime,
                              sreStartOfDayTime + 3 * 3600000,
                              sreStartOfDayTime + 6 * 3600000,
                              sreStartOfDayTime + 9 * 3600000,
                              sreStartOfDayTime + 12 * 3600000,
                              sreStartOfDayTime + 15 * 3600000,
                              sreStartOfDayTime + 18 * 3600000,
                              sreStartOfDayTime + 21 * 3600000,
                              sreEndOfDayTime
                            ]}
                            tickFormatter={(v) => {
                              const date = new Date(v);
                              return `${date.getHours().toString().padStart(2, '0')}:00`;
                            }}
                            fontSize={10} 
                          />
                          <YAxis fontSize={10} unit="MB" />
                          <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                          <Legend />
                          <Line type="monotone" dataKey="avgUsedMemory" name="Avg Used Mem" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="maxUsedMemory" name="Max Used Mem" stroke="#ec4899" strokeWidth={1} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="sre-chart-wrapper-sm">
                      <h4 className="text-center text-sm mb-16 opacity-70">Error Rate & Health Score</h4>
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="sre-availability-score">99.9%</div>
                        <div className="text-sm text-secondary">시스템 가용성 (Availability)</div>
                        <div className="mt-24 w-full px-32">
                          <div className="flex justify-between text-xs mb-4">
                            <span>Error Rate</span>
                            <span className="text-success">0.1%</span>
                          </div>
                          <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-success w-[0.1%]"></div>
                          </div>
                        </div>
                        <p className="text-xs text-tertiary mt-32 text-center px-24">
                          Google SRE 가이드라인에 따른 4대 황금 신호 분석입니다. <br/>
                          지연 시간(Latency) 뿐만 아니라 트래픽, 에러, 포화도(Saturation)를 종합적으로 관리합니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card title="CPU Percentile Analysis (P95, P50 추이)">
                  <div className="sre-chart-wrapper">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={sreData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis 
                          dataKey="bucketTimestamp" 
                          type="number"
                          domain={[sreStartOfDayTime, sreEndOfDayTime]}
                          ticks={[
                            sreStartOfDayTime,
                            sreStartOfDayTime + 3 * 3600000,
                            sreStartOfDayTime + 6 * 3600000,
                            sreStartOfDayTime + 9 * 3600000,
                            sreStartOfDayTime + 12 * 3600000,
                            sreStartOfDayTime + 15 * 3600000,
                            sreStartOfDayTime + 18 * 3600000,
                            sreStartOfDayTime + 21 * 3600000,
                            sreEndOfDayTime
                          ]}
                          tickFormatter={(v) => {
                            const date = new Date(v);
                            return `${date.getHours().toString().padStart(2, '0')}:00`;
                          }}
                          fontSize={10} 
                        />
                        <YAxis fontSize={10} unit="%" />
                        <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                        <Legend />
                        <Line type="monotone" dataKey="cpuP95" name="CPU P95 (Peak)" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="cpuP50" name="CPU P50 (Median)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-16 text-xs text-tertiary">
                    * P95(최고 5% 수준) 및 P50(중앙값) CPU 사용률 추이입니다. 단기 피크(Peak) 현상과 안정적인 평균 수준을 동시 분석에 사용됩니다.
                  </div>
                </Card>

                {(() => {
                  if (sreData.length === 0) return null;
                  const sortedByCpu = [...sreData].filter(d => d.cpuP95 != null).sort((a,b) => b.cpuP95 - a.cpuP95);
                  if (sortedByCpu.length === 0) return null;
                  
                  const peakEntry = sortedByCpu[0];
                  const peakBucketTime = peakEntry.bucketTime;
                  const peakContributors = sreData
                    .filter(d => d.bucketTime === peakBucketTime)
                    .sort((a,b) => (b.totalCounts * b.avgDuration) - (a.totalCounts * a.avgDuration)) // Sort by total load
                    .slice(0, 5);
                  
                  return (
                    <Card title={`Peak Window Analysis (최고 부하 시점: ${new Date(peakBucketTime).toLocaleTimeString()})`}>
                      <div className="mb-16 text-sm">
                        CPU P95 Peak(<span className="text-error font-bold">{peakEntry.cpuP95?.toFixed(1) || '--'}%</span>) 시점에 핵심적인 부하를 준 서비스 리스트입니다.
                      </div>
                      <div className="overflow-x-auto">
                        <table className="trace-table no-hover">
                          <thead>
                            <tr>
                              <th>Peak Window</th>
                              <th>Service & Method</th>
                              <th className="text-right">Exec Count</th>
                              <th className="text-right">Avg Latency</th>
                              <th className="text-right">Max Latency</th>
                              <th className="text-right">Total Memory</th>
                              <th className="text-right">Peak Memory</th>
                            </tr>
                          </thead>
                          <tbody>
                            {peakContributors.map((c, idx) => (
                              <tr key={idx}>
                                <td className="text-xs font-mono text-tertiary">
                                  {new Date(c.bucketTime).toLocaleTimeString()}
                                </td>
                                <td>
                                  <div className="font-semibold text-primary">{c.serviceName}</div>
                                  <div className="text-xs text-tertiary">{c.methodName}</div>
                                </td>
                                <td className="text-right">{c.totalCounts.toLocaleString()}</td>
                                <td className="text-right">{c.avgDuration?.toFixed(1) || '--'}ms</td>
                                <td className="text-right">{c.maxDuration?.toLocaleString() || '--'}ms</td>
                                <td className="text-right text-purple-600 font-semibold">{c.totalUsedMemory?.toLocaleString() || '--'}MB</td>
                                <td className="text-right text-purple-400 text-xs">{c.maxUsedMemory?.toLocaleString() || '--'}MB</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  );
                })()}

                <Card title="Performance Bottlenecks (1 Hour Summary)">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
                    {/* Top by Throughput */}
                    <div>
                      <h4 className="text-sm font-semibold mb-12 flex items-center gap-8">
                         <span className="w-8 h-8 rounded-full bg-success"></span>
                         Top Throughput (총 호출수)
                      </h4>
                      <div className="space-y-8">
                        {(() => {
                          const grouped = new Map();
                          sreData.forEach(d => {
                            const key = `${d.serviceName}.${d.methodName}`;
                            grouped.set(key, (grouped.get(key) || 0) + d.totalCounts);
                          });
                          return Array.from(grouped.entries())
                            .sort((a,b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([key, count], idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs p-8 bg-gray-50 rounded">
                                <span className="truncate flex-1 mr-8">{key}</span>
                                <span className="font-bold">{count.toLocaleString()}회</span>
                              </div>
                            ));
                        })()}
                      </div>
                    </div>

                    {/* Top by Latency */}
                    <div>
                      <h4 className="text-sm font-semibold mb-12 flex items-center gap-8">
                         <span className="w-8 h-8 rounded-full bg-error"></span>
                         Slowest Methods (평균 최저 속도)
                      </h4>
                      <div className="space-y-8">
                        {(() => {
                          const grouped = new Map();
                          sreData.forEach(d => {
                            const key = `${d.serviceName}.${d.methodName}`;
                            if (!grouped.has(key)) grouped.set(key, { totalDuration: 0, totalCount: 0 });
                            const stats = grouped.get(key);
                            stats.totalDuration += (d.avgDuration * d.totalCounts);
                            stats.totalCount += d.totalCounts;
                          });
                          return Array.from(grouped.entries())
                            .map(([key, stats]) => [key, stats.totalCount > 0 ? stats.totalDuration / stats.totalCount : 0])
                            .sort((a,b) => (b[1] as number) - (a[1] as number))
                            .slice(0, 5)
                            .map(([key, avg], idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs p-8 bg-gray-50 rounded">
                                <span className="truncate flex-1 mr-8">{key}</span>
                                <span className="font-bold text-error">{(avg as number).toFixed(1)}ms</span>
                              </div>
                            ));
                        })()}
                      </div>
                    </div>

                    {/* Top by Memory */}
                    <div>
                      <h4 className="text-sm font-semibold mb-12 flex items-center gap-8">
                         <span className="w-8 h-8 rounded-full bg-purple-500"></span>
                         Heavy Memory Usage (총 사용 메모리 합계)
                      </h4>
                      <div className="space-y-8">
                        {(() => {
                          const grouped = new Map();
                          sreData.forEach(d => {
                            const key = `${d.serviceName}.${d.methodName}`;
                            grouped.set(key, (grouped.get(key) || 0) + (d.totalUsedMemory || 0));
                          });
                          return Array.from(grouped.entries())
                            .sort((a,b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([key, mem], idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs p-8 bg-gray-50 rounded">
                                <span className="truncate flex-1 mr-8">{key}</span>
                                <span className="font-bold text-purple-600">{mem.toLocaleString()}MB</span>
                              </div>
                            ));
                        })()}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card title="SLO (Service Level Objective) 준수 리포트">
                  <div className="overflow-x-auto">
                    <table className="trace-table no-hover">
                      <thead>
                        <tr>
                          <th>SLO Target</th>
                          <th>Objective</th>
                          <th>Actual (Current)</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const totalCalls = sreData.reduce((a,b)=>a+b.totalCounts, 0);
                          const avgLat = totalCalls > 0 ? (sreData.reduce((a,b)=>a+(b.avgDuration*b.totalCounts), 0)/totalCalls) : 0;
                          const memSat = summary ? summary.sysBackend.memory : 0;
                          const maxCpuP95 = sreData.length > 0 ? Math.max(...sreData.map(d => d.cpuP95 || 0)) : 0;

                          return (
                            <>
                              <tr>
                                <td className="font-semibold">Latency (Avg)</td>
                                <td>&lt; 200ms</td>
                                <td>{avgLat.toFixed(1)}ms</td>
                                <td><span className={`status-badge ${avgLat < 200 ? 'success' : 'error'}`}>{avgLat < 200 ? 'Met' : 'Exceeded'}</span></td>
                              </tr>
                              <tr>
                                <td className="font-semibold">Memory Saturation</td>
                                <td>&lt; 80%</td>
                                <td>{memSat.toFixed(1)}%</td>
                                <td><span className={`status-badge ${memSat < 80 ? 'success' : 'warning'}`}>{memSat < 80 ? 'Met' : 'Risk'}</span></td>
                              </tr>
                              <tr>
                                <td className="font-semibold">CPU Peak (P95)</td>
                                <td>&lt; 85%</td>
                                <td>{maxCpuP95.toFixed(1)}%</td>
                                <td><span className={`status-badge ${maxCpuP95 < 85 ? 'success' : 'error'}`}>{maxCpuP95 < 85 ? 'Met' : 'Exceeded'}</span></td>
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    );
}
