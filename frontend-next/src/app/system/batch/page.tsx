'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { Play, Pause, Edit2, Check, X, RefreshCcw } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import './BatchManagement.css';

interface BatchJob {
  jobName: string;
  jobGroup: string;
  description: string;
  cronExpression: string;
  state: string;
  nextFireTime: string | null;
  previousFireTime: string | null;
}

export default function BatchManagementPage() {
  const { t } = useTranslation();
  
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [editCron, setEditCron] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<BatchJob[]>('/api/v1/system/batch/jobs');
      setJobs(data);
    } catch (e: unknown) {
      console.error('Failed to fetch batch jobs', e);
      if (e instanceof Error) {
        setError(e.message || '데이터를 불러오는데 실패했습니다.');
      } else {
        setError('데이터를 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 60000); // 1 min auto refresh
    return () => clearInterval(interval);
  }, []);

  const handlePause = async (jobGroup: string, jobName: string) => {
    await apiClient.post(`/api/v1/system/batch/jobs/${jobGroup}/${jobName}/pause`);
    fetchJobs();
  };

  const handleResume = async (jobGroup: string, jobName: string) => {
    await apiClient.post(`/api/v1/system/batch/jobs/${jobGroup}/${jobName}/resume`);
    fetchJobs();
  };

  const saveCron = async (jobGroup: string, jobName: string) => {
    if (!editCron.trim()) return;
    try {
      await apiClient.put(`/api/v1/system/batch/jobs/${jobGroup}/${jobName}/cron`, {
        cronExpression: editCron.trim()
      });
      setEditingJob(null);
      fetchJobs();
    } catch (error) {
      console.error(error);
      alert('크론 표현식 수정에 실패했습니다. (유효하지 않은 Cron 양식일 수 있습니다)');
    }
  };

  return (
    <div className="template-page fade-in p-6">
      <div className="flex justify-between items-center mb-6">
        <PageHeader 
          title={t('sidebar.batch_management', '배치 관리')} 
          description="백로그/비동기 배치 스케줄러를 관리합니다. (Quartz Jobs)"
          breadcrumbs={[t('sidebar.system_management', '시스템 관리'), t('sidebar.batch_management', '배치 관리')]}
        />
        <button className="btn btn-outline flex items-center gap-8" onClick={fetchJobs} disabled={loading}>
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> {t('common.refresh', '새로고침')}
        </button>
      </div>

      <Card title="현재 등록된 배치 작업 목록">
        <div className="table-responsive">
          <table className="batch-table">
            <thead>
              <tr>
                <th>소속 그룹 (Group)</th>
                <th>작업명 (Job Name)</th>
                <th>설명 (Description)</th>
                <th>스케줄 (Cron)</th>
                <th>상태</th>
                <th>최근 실행 시간</th>
                <th>다음 실행 예정 시간</th>
                <th className="text-center">작업 제어</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr>
                  <td colSpan={8} className="text-center p-16 text-danger">
                    에러 발생: {error}
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-16 text-tertiary">
                    {loading ? '데이터 로딩 중...' : '등록된 배치 작업이 없습니다.'}
                  </td>
                </tr>
              ) : jobs.map(job => {
                const isEditing = editingJob === job.jobName;
                const isPaused = job.state === 'PAUSED';
                
                return (
                  <tr key={`${job.jobGroup}-${job.jobName}`}>
                    <td>{job.jobGroup}</td>
                    <td className="font-medium text-primary">{job.jobName}</td>
                    <td className="text-tertiary">{job.description || '-'}</td>
                    
                    <td className="cron-cell">
                      {isEditing ? (
                        <div className="flex items-center gap-4">
                          <input 
                            className="input-cron"
                            title="Cron Expression"
                            placeholder="Cron Expression"
                            value={editCron} 
                            onChange={e => setEditCron(e.target.value)} 
                            autoFocus
                          />
                          <button title="Save Cron" onClick={() => saveCron(job.jobGroup, job.jobName)} className="text-success hover:text-green-600"><Check size={16}/></button>
                          <button title="Cancel Edit" onClick={() => setEditingJob(null)} className="text-danger hover:text-red-500"><X size={16}/></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-8">
                          <span className="mono-text">{job.cronExpression || '-'}</span>
                          <button 
                            title="Edit Cron"
                            className="edit-cron-btn text-tertiary hover:text-primary" 
                            onClick={() => {
                              setEditingJob(job.jobName);
                              setEditCron(job.cronExpression || '');
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                    
                    <td>
                      <span className={`status-badge ${isPaused ? 'paused' : 'running'}`}>
                        {isPaused ? 'PAUSED' : job.state}
                      </span>
                    </td>
                    <td className="text-tertiary">{job.previousFireTime || '-'}</td>
                    <td className="text-secondary">{job.nextFireTime || '-'}</td>
                    
                    <td className="text-center action-cell">
                      {isPaused ? (
                        <button title="Resume Job" className="action-btn resume-btn" onClick={() => handleResume(job.jobGroup, job.jobName)}>
                          <Play size={16} /> 재개
                        </button>
                      ) : (
                        <button title="Pause Job" className="action-btn pause-btn" onClick={() => handlePause(job.jobGroup, job.jobName)}>
                          <Pause size={16} /> 정지
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
