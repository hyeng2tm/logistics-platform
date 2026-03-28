'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { Layout, MessageSquare, RefreshCcw, Server, Activity, Filter, AlertCircle, Play, Pause } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Bar, AreaChart, Area, PieChart, Pie, Cell, BarChart
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

// MetricGlossary moved inside SystemMonitoringPage
export default function SystemMonitoringPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('summary');

  
  const [summary, setSummary] = useState<SystemSummary | null>(null);
  const [history, setHistory] = useState<ChartPoint[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionTrace[]>([]);
  const [sreData, setSreData] = useState<SREAnalysis[]>([]);
  const [executionLogFilter, setExecutionLogFilter] = useState<string>('All');
  const [traceAppFilter, setTraceAppFilter] = useState<string>('sys-backend');
  const [traceHourFilter, setTraceHourFilter] = useState<string>(new Date().getHours().toString().padStart(2, '0'));
  const [tracePage, setTracePage] = useState<number>(1);
  const [sreDateFilter, setSreDateFilter] = useState('2026-03-25');

  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

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

  // Helper component to avoid inline styles for dynamic widths (resolves lints)
  const ProgressBar = ({ progress, secondary }: { progress: number, secondary?: boolean }) => {
    const barRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
      if (barRef.current) {
        barRef.current.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      }
    }, [progress]);

    return (
      <div 
        ref={barRef}
        className={`progress-bar-fill ${secondary ? 'progress-bar-fill-secondary' : ''}`} 
      />
    );
  };

  useEffect(() => {
    setTracePage(1);
  }, [traceAppFilter, traceHourFilter, executionLogs]);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayTime = startOfDay.getTime();
  
  const sreStartOfDay = new Date(sreDateFilter);
  sreStartOfDay.setHours(0, 0, 0, 0);
  const sreStartOfDayTime = sreStartOfDay.getTime();
  
  const sreEndOfDayTime = sreStartOfDayTime + 24 * 3600000;
  
  // Create a strictly rigid 24-hour padded array to ensure Recharts draws perfectly equidistant dots 
  // every hour, completely removing the optical illusion caused by sparse (missing) early morning data.
  const displaySreData = [];
  for (let h = 0; h <= 24; h++) {
    const bucketTs = sreStartOfDayTime + h * 3600000;
    const timeLabel = h === 24 ? "24:00" : `${h.toString().padStart(2, '0')}:00`;
    const existing = (sreData || []).find((d: Record<string, any>) => Math.abs(d.bucketTimestamp - bucketTs) < 300000);
    if (existing) {
      displaySreData.push({ ...existing, bucketTimestamp: bucketTs, timeLabel, hourIndex: h });
    } else {
      displaySreData.push({
        bucketTimestamp: bucketTs,
        timeLabel,
        hourIndex: h,
        avgDuration: 0,
        maxDuration: 0,
        totalCounts: 0,
        avgUsedMemory: 0,
        maxUsedMemory: 0,
        cpuP95: 0,
        cpuP50: 0
      });
    }
  }


  // Aggregate by hour for the chart (00 to 23 = 24 segments)
  const hourlyData: Record<string, string | number>[] = [];
  for (let h = 0; h < 24; h++) {
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
    if (h >= 0 && h < 24) {
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
      
      if (data) {
        const combinedData = data.map(d => ({
          ...d,
          bucketTimestamp: new Date(d.bucketTime).getTime()
        })).sort((a,b) => a.bucketTime.localeCompare(b.bucketTime));
        setSreData(combinedData);
      }
    } catch (e) {
      console.error('Failed to fetch SRE analysis data', e);
    }
  };

  const loadData = async (force: boolean = false) => {
    if (!autoRefresh && !force) return;
    setLoading(true);
    
    const tasks = [];
    if (activeTab === 'summary' || force) tasks.push(fetchSummary(), fetchHistory());
    if (activeTab === 'execution' || force) tasks.push(fetchExecutionLogs());
    if (activeTab === 'logs' || force) tasks.push(fetchLogs());
    if (activeTab === 'sre' || force) tasks.push(fetchSreAnalysis());
    
    await Promise.all(tasks);
    setLoading(false);
  };

  useEffect(() => {
    loadData(true);
    // Refresh every 60 seconds (optimized from 30s)
    const interval = setInterval(() => loadData(), 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, autoRefresh]);

  useEffect(() => {
    if (activeTab === 'sre') {
      fetchSreAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sreDateFilter]);

  const renderServerCard = (id: string, stats: ServerStats | undefined, iconColor: string = 'text-primary') => {
    if (!stats) return null;
    
    // Determine glow class based on server type
    const glowClass = id.includes('backend') ? 'neon-glow-indigo' : 
                      id.includes('db') ? 'neon-glow-cyan' : 
                      id.includes('auth') ? 'neon-glow-magenta' : 'neon-glow-indigo';

    return (
      <Card key={id} title={
        <div className="flex items-center gap-12">
          <Server size={20} className={iconColor + " " + glowClass} />
          <span className="font-bold tracking-tight">{stats.name || id.toUpperCase()}</span>
          <span className={`status-badge ${stats.status === 'Healthy' ? 'success' : 'danger'}`}>
            {stats.status}
          </span>
        </div>
      }>
        <div className="card-stat-grid">
          <div className="stat-card large">
            <div className="stat-label">Latency</div>
            <div className={`stat-value ${glowClass}`}>{stats.latency?.toFixed(0) ?? '--'}<span className="text-[14px] ml-2 opacity-50 font-normal">ms</span></div>
          </div>
          <div className="stat-card large">
            <div className="stat-label">TPS</div>
            <div className={`stat-value ${glowClass}`}>{stats.tps?.toFixed(1) ?? '--'}</div>
          </div>
          <div className="stat-card large">
            <div className="stat-label">CPU</div>
            <div className={`stat-value ${glowClass}`}>{stats.cpu.toFixed(1)}<span className="text-[14px] ml-2 opacity-50 font-normal">%</span></div>
          </div>
          <div className="stat-card large">
            <div className="stat-label">Memory</div>
            <div className={`stat-value ${glowClass}`}>{stats.memory}<span className="text-[14px] ml-2 opacity-50 font-normal">%</span></div>
          </div>
        </div>

        {stats.instances && stats.instances.length > 0 && (
          <div className="instance-list-area mt-4">
            <div className="stat-label mb-2 flex items-center gap-4">
              <Activity size={14} className="text-tertiary" /> {t('monitoring.active_instances', '가동 인스턴스')} ({stats.instances.length})
            </div>
            <div className="flex flex-wrap gap-6">
              {stats.instances.map(inst => (
                <div key={inst.id} className="instance-chip" title={`CPU: ${inst.cpu.toFixed(1)}%, Mem: ${inst.memory}%`}>
                  <div className={`status-dot ${inst.status === 'Healthy' ? 'bg-success status-dot-active' : 'bg-danger status-dot-error'}`}></div>
                  <span className="instance-id font-mono text-[10px]">{inst.id.split('-').pop()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="template-page fade-in p-6">
      <div className="flex justify-between items-center mb-6">
        <PageHeader 
          title={t('sidebar.system_monitoring', '시스템 모니터링')} 
          description="주요 서버별 실시간 성능 추이 및 4대 황금 신호(Golden Signals)를 분석합니다."
          breadcrumbs={[t('sidebar.system_management', '시스템 관리'), t('sidebar.system_monitoring', '시스템 모니터링')]}
        />
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-8 px-12 py-6 bg-gray-50 rounded-lg border border-gray-100">
            <span className="text-xs font-medium text-gray-600">{t('monitoring.auto_refresh', '자동 갱신')}</span>
            <button 
              className={`refresh-toggle ${autoRefresh ? 'active' : ''}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? t('monitoring.refresh_interval_60s') : t('monitoring.refresh_paused')}
            >
              {autoRefresh ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>
          <button className="btn btn-outline flex items-center gap-8" onClick={() => loadData(true)} disabled={loading}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> {t('common.refresh', '새로고침')}
          </button>
        </div>
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
            <Activity size={18} className="text-accent-primary" /> {t('monitoring.sre_golden_signals', 'SRE 골든 시그널')}
          </button>
          <button 
            className={`tab-item ${activeTab === 'sre_performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('sre_performance')}
          >
            <Activity size={18} className="text-accent-gold" /> {t('monitoring.sre_performance', 'SRE 성능 분석')}
          </button>
        </div>

        {activeTab === 'summary' && (
          <div className="tab-content-area mt-4 pb-48 fade-in">
            {loading && !summary ? (
              <div className="empty-state">
                <RefreshCcw size={48} className="animate-spin mb-16 opacity-20" />
                <p>데이터를 불러오는 중입니다...</p>
              </div>
            ) : summary ? (
              <div className="fade-in">
                {/* Row 1: Top Metrics */}
                <div className="dashboard-grid-top">
                  {/* CPU LOAD Card */}
                  <div className="card premium-metric-card">
                    <div>
                      <div className="card-label">CPU LOAD</div>
                      <div className="card-value neon-glow-cyan">{summary.sysBackend.cpu.toFixed(0)}%</div>
                    </div>
                    <div className="mini-chart-container">
                      <ResponsiveContainer width="100%" height={80}>
                        <AreaChart data={history.slice(-20)}>
                          <defs>
                            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--neon-cyan)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--neon-cyan)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="sysCpu" stroke="var(--neon-cyan)" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={3} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                      <div className="text-[10px] text-white/30 mt-4 flex justify-between">
                        <span>Dynamic Wave Chart</span>
                        <span>Avg: 41%</span>
                      </div>
                    </div>
                  </div>

                  {/* MEMORY Card */}
                  <div className="card premium-metric-card">
                    <div>
                      <div className="card-label">MEMORY</div>
                      <div className="circular-gauge-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Used', value: summary.sysBackend.memory },
                                { name: 'Free', value: 100 - summary.sysBackend.memory }
                              ]}
                              innerRadius={45}
                              outerRadius={55}
                              startAngle={180}
                              endAngle={-180}
                              paddingAngle={0}
                              dataKey="value"
                              isAnimationActive={false}
                            >
                              <Cell fill="var(--accent-success)" stroke="none" />
                              <Cell fill="rgba(255,255,255,0.05)" stroke="none" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="circular-gauge-info">
                          <div className="text-xl font-bold">{summary.sysBackend.memory}%</div>
                          <div className="text-[8px] opacity-40">/ 128GB</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-white/30 mt-8 flex justify-between">
                      <span>Circular Gauge</span>
                      <span>Cached: 45GB</span>
                    </div>
                  </div>

                  {/* NETWORK Card */}
                  <div className="card premium-metric-card">
                    <div>
                      <div className="card-label">NETWORK</div>
                      <div className="flex gap-16 items-baseline">
                        <div className="text-2xl font-bold neon-glow-magenta"><span className="text-[10px] opacity-40 mr-4">IN:</span>1.2 <span className="text-[10px] font-normal">GB/s</span></div>
                        <div className="text-2xl font-bold neon-glow-indigo"><span className="text-[10px] opacity-40 mr-4">OUT:</span>940 <span className="text-[10px] font-normal">MB/s</span></div>
                      </div>
                    </div>
                    <div className="mini-chart-container">
                      <ResponsiveContainer width="100%" height={60}>
                        <AreaChart data={history.slice(-20)}>
                          <Area type="monotone" dataKey="sysTps" stroke="var(--neon-magenta)" fill="var(--neon-magenta)" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                          <Area type="monotone" dataKey="authTps" stroke="var(--accent-primary)" fill="var(--accent-primary)" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                      <div className="text-[10px] text-white/30 mt-4 flex justify-between">
                        <span>Gradient Area Charts</span>
                        <span>Latency: {summary.sysBackend.latency}ms</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Mid Content */}
                <div className="dashboard-grid-mid">
                  <div className="dashboard-grid-mid-cols">
                    <Card title="INFRASTRUCTURE HEALTH">
                      <div className="mini-chart-container chart-h-240">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={history}>
                            <defs>
                              <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                            <XAxis 
                              dataKey="timestamp" 
                              type="number"
                              domain={[startOfDayTime, startOfDayTime + 24 * 3600000]}
                              ticks={[
                                startOfDayTime,
                                startOfDayTime + 6 * 3600000,
                                startOfDayTime + 12 * 3600000,
                                startOfDayTime + 18 * 3600000,
                                startOfDayTime + 24 * 3600000
                              ]}
                              tickFormatter={(v) => {
                                const date = new Date(v);
                                if (v === startOfDayTime + 24 * 3600000) return "24:00";
                                if (v === sreEndOfDayTime) return "24:00";
                               return `${date.getHours().toString().padStart(2, "0")}:00`;
                              }}
                              fontSize={10}
                            />
                            <YAxis domain={[0, 100]} fontSize={10} />
                            <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} contentStyle={{background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '10px'}} />
                            <Area type="monotone" dataKey="sysCpu" stroke="var(--accent-primary)" fill="url(#colorHealth)" strokeWidth={3} dot={false} activeDot={{r: 4}} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card title="SERVER PERFORMANCE">
                      <div className="mini-chart-container chart-h-240">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            {id: 1, val: 40}, {id: 2, val: 65}, {id: 3, val: 45}, {id: 4, val: 80},
                            {id: 5, val: 55}, {id: 6, val: 70}, {id: 7, val: 90}, {id: 8, val: 60}
                          ]}>
                            <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                              { [40, 65, 45, 80, 55, 70, 90, 60].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--accent-success)' : 'var(--neon-cyan)'} fillOpacity={0.8} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </div>

                  <Card title="ACTIVE ALERTS">
                    <div className="alert-panel">
                      <div className="alert-item critical">
                        <div className="alert-tag text-accent-danger">Critical</div>
                        <div className="text-xs font-bold text-white/90">Disk Space Low - Server-A11</div>
                      </div>
                      <div className="alert-item warning">
                        <div className="alert-tag text-accent-warning">Warning</div>
                        <div className="text-xs font-bold text-white/90">Latent spikes detected in Auth</div>
                      </div>
                      <div className="alert-item ok">
                        <div className="alert-tag text-accent-success">OK</div>
                        <div className="text-xs font-bold text-white/90">Database replication stable</div>
                      </div>
                      <div className="alert-item ok">
                        <div className="alert-tag text-accent-success">OK</div>
                        <div className="text-xs font-bold text-white/90">Batch job #122 finished</div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Legacy Resource Grid (Keep for Real-time info but style it secondary) */}
                <div className="flex justify-between items-center mt-32 mb-16 px-8">
                  <h3 className="text-sm font-bold opacity-40 uppercase tracking-widest">Live Node Status</h3>
                  <span className="text-[10px] text-tertiary">수집 시각: {new Date(summary.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="dashboard-grid-top opacity-80">
                  {renderServerCard('sysBackend', summary.sysBackend, 'chart-text-backend')}
                  {renderServerCard('authServer', summary.authServer, 'chart-text-auth')}
                  {renderServerCard('batchServer', summary.batchServer, 'chart-text-batch')}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <AlertCircle size={48} className="mb-16 opacity-20" />
                <p>데이터를 불러오지 못했습니다. 서버 상태나 로그인 세션을 확인해주세요.</p>
                <button className="btn btn-primary mt-16" onClick={() => loadData(true)}>새로고침 시도</button>
              </div>
            )}
          </div>
        )}

          {activeTab === 'execution' && (
            <div className="tab-content-area mt-4 pb-48 fade-in flex flex-col gap-32">
              {/* Execution Summary Cards */}
              <div className="dashboard-grid-top">
                {appAggList.map(agg => (
                  <div key={agg.appId} className="card premium-metric-card">
                    <div>
                      <div className="card-label">{agg.appId} TRACES</div>
                      <div className="card-value neon-glow-indigo">{agg.count.toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col gap-4 mt-8">
                      <div className="flex justify-between text-[11px] opacity-40 uppercase font-bold">
                        <span>Total Duration</span>
                        <span>{agg.totalDuration.toLocaleString()} ms</span>
                      </div>
                      <div className="flex justify-between text-[11px] opacity-40 uppercase font-bold">
                        <span>Memory Load</span>
                        <span>{agg.totalMemory.toFixed(0)} MB</span>
                      </div>
                    </div>
                    <div className="mini-chart-container mt-12">
                      <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <ProgressBar progress={(agg.count / 1000) * 100} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="filter-section">
                <div className="premium-filter-bar">
                  <Filter size={16} className="text-accent-primary" />
                  <div className="flex gap-12">
                    {['All', ...uniqueApps].map(app => (
                      <button
                        key={app}
                        onClick={() => setExecutionLogFilter(app)}
                        className={`text-xs font-bold transition-all ${executionLogFilter === app ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
                      >
                        {app === 'All' ? 'ALL APPS' : app.toUpperCase()}
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
                        padding={{ left: 10, right: 10 }}
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
                  <span className="tracking-tight">실시간 상세 트레이스 타임라인</span>
                  <div className="flex gap-12">
                    <select 
                      className="premium-select"
                      value={traceAppFilter}
                      onChange={(e) => setTraceAppFilter(e.target.value)}
                      title="App Filter"
                      aria-label="Filter by app"
                    >
                      {uniqueApps.map(app => (
                        <option key={app} value={app} className="bg-slate-900">{app}</option>
                      ))}
                    </select>
                    <select 
                      className="premium-select"
                      value={traceHourFilter}
                      onChange={(e) => setTraceHourFilter(e.target.value)}
                      title="Hour Filter"
                      aria-label="Filter by hour"
                    >
                      {Array.from({ length: 24 }).map((_, i) => {
                        const hourStr = i.toString().padStart(2, '0');
                        return <option key={hourStr} value={hourStr} className="bg-slate-900">{hourStr}시 ~ {(i+1).toString().padStart(2, '0')}시</option>;
                      })}
                    </select>
                  </div>
                </div>
              }>
                <div className="overflow-x-auto px-4">
                  <table className="trace-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Endpoint / Method</th>
                        <th className="text-right">Duration</th>
                        <th className="text-right">Resource Load</th>
                        <th>Activity Summary</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTableData.map(log => {
                        const logDate = new Date(log.timestamp);
                        const timeStr = isNaN(logDate.getTime()) ? '--:--:--' : logDate.toLocaleTimeString();
                        return (
                          <tr key={log.id}>
                            <td className="text-xs text-white/40 font-mono">{timeStr}</td>
                          <td>
                            <div className="font-bold text-white/90">{log.appId || log.serviceName}</div>
                            <div className="text-[10px] text-accent-primary font-mono opacity-80">{log.methodName}</div>
                          </td>
                          <td className="text-right">
                            <span className={`status-badge ${log.duration > 300 ? 'danger' : 'success'} shadow-sm`}>
                              {log.duration}ms
                            </span>
                          </td>
                          <td className="text-right pr-24">
                            <div className="font-mono text-[10px] mb-4">
                              <span className="text-white/80">{log.usedMemory.toFixed(0)}</span> <span className="text-white/30">/ {log.totalMemory.toFixed(0)}MB</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <ProgressBar progress={(log.usedMemory / log.totalMemory) * 100} secondary />
                            </div>
                          </td>
                          <td>
                            <div className="query-cell text-white/50 text-[11px]" title={log.query}>
                              {log.query || '(No direct query logs)'}
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
                          <td colSpan={6} className="text-center text-white/20 py-64">검색 조건에 맞는 트레이스 내역이 존재하지 않습니다.</td>
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
              <div className="filter-section">
                <div className="premium-filter-bar shadow-lg">
                  <Filter size={16} className="text-accent-primary" />
                  <label htmlFor="sre-date-filter" className="text-sm font-medium text-white/70">분석 일자:</label>
                  <input 
                    id="sre-date-filter"
                    type="date" 
                    value={sreDateFilter} 
                    onChange={(e) => setSreDateFilter(e.target.value)}
                    className="premium-date-input border-none"
                    title="분석 일자 선택"
                  />
                </div>
                <button 
                  className="flex items-center gap-8 bg-accent-primary/20 text-white px-20 py-10 rounded-full border border-accent-primary/30 hover:bg-accent-primary/30 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] ml-auto" 
                  onClick={() => fetchSreAnalysis()}
                >
                  <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                  <span className="text-sm font-bold">분석 데이터 갱신</span>
                </button>
              </div>
              <div className="flex flex-col gap-24">
                <Card title="SRE Golden Signal: Latency & Traffic">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
                    <div className="sre-chart-wrapper-sm">
                      <h4 className="text-center text-sm mb-16 opacity-70">Latency (평균 응답 시간)</h4>
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={displaySreData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                          <XAxis 
                            dataKey="hourIndex" 
                            type="number"
                            domain={[0, 24]}
                            ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
                            tickFormatter={(v) => v === 24 ? "24:00" : `${v.toString().padStart(2, '0')}:00`}
                            fontSize={10} 
                            tickMargin={8}
                          />
                          <YAxis fontSize={10} unit="ms" />
                          <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                          <Legend />
                          <Line type="monotone" dataKey="avgDuration" name="Avg Latency" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-primary)', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="maxDuration" name="Max Latency" stroke="var(--accent-danger)" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="sre-chart-wrapper-sm">
                      <h4 className="text-center text-sm mb-16 opacity-70">Traffic (요청 처리량)</h4>
                      <ResponsiveContainer width="100%" height={240}>
                        <ComposedChart data={displaySreData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                          <XAxis 
                            dataKey="hourIndex" 
                            type="number"
                            domain={[0, 24]}
                            ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
                            tickFormatter={(v) => v === 24 ? "24:00" : `${v.toString().padStart(2, '0')}:00`}
                            fontSize={10} 
                            tickMargin={8}
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
                        <LineChart data={displaySreData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                          <XAxis 
                            dataKey="hourIndex" 
                            type="number"
                            domain={[0, 24]}
                            ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
                            tickFormatter={(v) => v === 24 ? "24:00" : `${v.toString().padStart(2, '0')}:00`}
                            fontSize={10} 
                            tickMargin={8}
                          />
                          <YAxis fontSize={10} unit="MB" />
                          <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                          <Legend />
                            <Line type="monotone" dataKey="avgUsedMemory" name="Avg Used Mem" stroke="var(--accent-secondary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-secondary)', strokeWidth: 0 }} />
                            <Line type="monotone" dataKey="maxUsedMemory" name="Max Used Mem" stroke="var(--neon-magenta)" strokeWidth={1} dot={false} strokeDasharray="3 3" />
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
                          <div className="h-8 bg-white/5 rounded-full overflow-hidden border border-white/10">
                            <div className="h-full bg-accent-danger shadow-[0_0_10px_var(--accent-danger)] w-[0.1%]"></div>
                          </div>
                        </div>
                        <p className="text-xs text-white/40 mt-32 text-center px-24 font-light">
                          Google SRE 가이드라인에 따른 4대 황금 신호 분석입니다. <br/>
                          지연 시간(Latency), 트래픽, 에러, 포화도(Saturation)를 종합 관리합니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'sre_performance' && (
            <div className="tab-content-area mt-4 pb-48 fade-in flex flex-col gap-24">
              <div className="filter-section">
                <div className="premium-filter-bar">
                  <Filter size={16} className="text-accent-primary" />
                  <label htmlFor="sre-perf-date-filter" className="text-sm font-medium text-white/70">분석 일자:</label>
                  <input 
                    id="sre-perf-date-filter"
                    type="date" 
                    value={sreDateFilter} 
                    onChange={(e) => setSreDateFilter(e.target.value)}
                    className="premium-date-input border-none"
                    title="분석 일자 선택"
                  />
                </div>
                <button 
                  className="flex items-center gap-8 bg-accent-primary/20 text-white px-20 py-10 rounded-full border border-accent-primary/30 hover:bg-accent-primary/30 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] ml-auto" 
                  onClick={() => fetchSreAnalysis()}
                >
                  <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                  <span className="text-sm font-bold">분석 데이터 갱신</span>
                </button>
              </div>

              <div className="flex flex-col gap-24">

                <Card title="CPU Percentile Analysis (P95, P50 추이)">
                  <div className="sre-chart-wrapper">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={displaySreData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis 
                          dataKey="hourIndex" 
                          type="number"
                          domain={[0, 24]}
                          ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
                          tickFormatter={(v) => v === 24 ? "24:00" : `${v.toString().padStart(2, '0')}:00`}
                          fontSize={10} 
                          tickMargin={8}
                        />
                        <YAxis fontSize={10} unit="%" domain={[0, 100]} />
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
                              <div key={idx} className="flex justify-between items-center text-xs p-8 bg-black/20 rounded">
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
                         <span className="w-8 h-8 rounded-full bg-accent-danger"></span>
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
                              <div key={idx} className="flex justify-between items-center text-xs p-8 bg-black/20 rounded">
                                <span className="truncate flex-1 mr-8">{key}</span>
                                <span className="font-bold text-accent-danger">{(avg as number).toFixed(1)}ms</span>
                              </div>
                            ));
                        })()}
                      </div>
                    </div>

                    {/* Top by Memory */}
                    <div>
                      <h4 className="text-sm font-semibold mb-12 flex items-center gap-8">
                         <span className="w-8 h-8 rounded-full bg-accent-secondary"></span>
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
                              <div key={idx} className="flex justify-between items-center text-xs p-8 bg-black/20 rounded">
                                <span className="truncate flex-1 mr-8">{key}</span>
                                <span className="font-bold text-accent-secondary">{mem.toLocaleString()}MB</span>
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

          {activeTab === 'logs' && (
            <div className="tab-content-area mt-4">
              <Card title="시스템 에러 로그 및 이벤트">
                <div className="log-viewer bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-16">
                  {loading && logs.length === 0 ? (
                    <div className="empty-state text-white/20">로그를 불러오는 중...</div>
                  ) : logs.length > 0 ? (
                    logs.map(log => (
                      <div key={log.id} className="log-entry border-b border-white/5 py-8 last:border-0 hover:bg-white/5 transition-colors px-8 rounded-lg">
                        <span className="log-timestamp text-white/30 font-mono text-[11px] mr-12">[{new Date(log.timestamp).toLocaleString()}]</span>
                        <span className={`log-level ${log.level} px-8 py-2 rounded text-[10px] uppercase font-bold mr-12 shadow-sm`}>{log.level}</span>
                        <span className="log-message text-white/80 text-sm">{log.message}</span>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state text-white/20">조회된 로그가 없습니다.</div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
}
