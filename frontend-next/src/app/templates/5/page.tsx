'use client';

import React, { useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';

import './Template5_Tabbed.css';

export default function Template5Page() {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'files'>('info');

  return (
    <div className="template-page fade-in p-6">
      <PageHeader 
        title="화물 상세 정보 (다중 탭 뷰)" 
        description="방대한 양의 연관 데이터를 여러 개의 탭 화면으로 나누어 보여줍니다."
        breadcrumbs={['템플릿', '탭 기반 뷰']}
      />

      <div className="template5-tab-container mt-6">
        <button 
          onClick={() => setActiveTab('info')}
          className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
        >
          기본 화물 정보
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
        >
          위치 / 처리 이력
        </button>
        <button 
          onClick={() => setActiveTab('files')}
          className={`tab-button ${activeTab === 'files' ? 'active' : ''}`}
        >
          첨부 문서함
        </button>
      </div>

      <Card>
        {activeTab === 'info' && (
          <div className="fade-in">
            <h3 className="tab-content-title">화물 기본 정보 영역</h3>
            <p className="tab-content-desc">여기에 화물의 규격, 무게, 송장번호, 배송자 연락처 등이 표출됩니다.</p>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="fade-in">
            <h3 className="tab-content-title">타임라인 이력 영역</h3>
            <ul className="timeline-list">
              <li><strong>2023-11-21 15:30</strong>: 대전 허브 터미널 간선 상차</li>
              <li><strong>2023-11-21 08:12</strong>: 구로 터미널 집화 처리</li>
              <li><strong>2023-11-20 18:00</strong>: 배송 데이터 등록</li>
            </ul>
          </div>
        )}
        {activeTab === 'files' && (
          <div className="fade-in">
            <h3 className="tab-content-title">문서 목록 영역</h3>
            <p className="tab-content-desc">인수증(POD), 세관 신고서 뷰어, 사진 첨부 내역 등이 들어가는 리스트.</p>
          </div>
        )}
      </Card>

    </div>
  );
}
