import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';

const Template5_Tabbed: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'files'>('info');

  return (
    <div className="template-page fade-in">
      <PageHeader 
        title="화물 상세 정보 (다중 탭 뷰)" 
        description="방대한 양의 연관 데이터를 여러 개의 탭 화면으로 나누어 보여줍니다."
        breadcrumbs={['템플릿', '탭 기반 뷰']}
      />

      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('info')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === 'info' ? 'var(--accent-blue)' : 'transparent'}`, fontWeight: 600, color: activeTab === 'info' ? 'var(--accent-blue)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          기본 화물 정보
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === 'history' ? 'var(--accent-blue)' : 'transparent'}`, fontWeight: 600, color: activeTab === 'history' ? 'var(--accent-blue)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          위치 / 처리 이력
        </button>
        <button 
          onClick={() => setActiveTab('files')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === 'files' ? 'var(--accent-blue)' : 'transparent'}`, fontWeight: 600, color: activeTab === 'files' ? 'var(--accent-blue)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          첨부 문서함
        </button>
      </div>

      <Card>
        {activeTab === 'info' && (
          <div className="fade-in">
            <h3 style={{ marginTop: 0 }}>화물 기본 정보 영역</h3>
            <p style={{ color: 'var(--text-secondary)' }}>여기에 화물의 규격, 무게, 송장번호, 배송자 연락처 등이 표출됩니다.</p>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="fade-in">
            <h3 style={{ marginTop: 0 }}>타임라인 이력 영역</h3>
            <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><strong>2023-11-21 15:30</strong>: 대전 허브 터미널 간선 상차</li>
              <li><strong>2023-11-21 08:12</strong>: 구로 터미널 집화 처리</li>
              <li><strong>2023-11-20 18:00</strong>: 배송 데이터 등록</li>
            </ul>
          </div>
        )}
        {activeTab === 'files' && (
          <div className="fade-in">
            <h3 style={{ marginTop: 0 }}>문서 목록 영역</h3>
            <p style={{ color: 'var(--text-secondary)' }}>인수증(POD), 세관 신고서 뷰어, 사진 첨부 내역 등이 들어가는 리스트.</p>
          </div>
        )}
      </Card>

    </div>
  );
};

export default Template5_Tabbed;
