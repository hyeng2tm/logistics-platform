'use client';

import React from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { DataTable } from '../../../components/common/DataTable';
import { Package, Truck, AlertTriangle } from 'lucide-react';

const mockList = [
  { id: '1', item: '엔진 오일 BOX', status: '출하 대기중' },
  { id: '2', item: '기어 파츠 B형', status: '상차 완료' },
  { id: '3', item: '브레이크 패드', status: '지연' },
];

import './Template7_SummaryList.css';

export default function Template7Page() {
  return (
    <div className="template-page fade-in p-6">
      <PageHeader 
        title="출하 센터 모니터링 (요약 + 목록 뷰)" 
        description="상단에서 현재 출하장의 요약 통계를 보고, 하단에서 상세 목록을 확인합니다."
        breadcrumbs={['템플릿', '요약 포함 목록']}
      />

      <div className="summary-list-container mt-6">
        {/* Top Summary Widgets */}
        <div className="summary-widgets-container">
          <Card className="summary-widget">
            <div className="summary-widget-content">
              <div className="summary-icon-box icon-box-blue">
                <Package size={24} />
              </div>
              <div>
                <span className="summary-label">총 출하 지시 건수</span>
                <div className="summary-value">1,430건</div>
              </div>
            </div>
          </Card>
          
          <Card className="summary-widget">
            <div className="summary-widget-content">
              <div className="summary-icon-box icon-box-green">
                <Truck size={24} />
              </div>
              <div>
                <span className="summary-label">상차/이동 완료</span>
                <div className="summary-value">920건</div>
              </div>
            </div>
          </Card>

          <Card className="summary-widget">
            <div className="summary-widget-content">
              <div className="summary-icon-box icon-box-red">
                <AlertTriangle size={24} />
              </div>
              <div>
                <span className="summary-label">출하 이상 발생 (지연/누락)</span>
                <div className="summary-value">12건</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom Detail List */}
        <Card title="상세 모니터링 목록" noPadding>
          <DataTable 
            columns={[
              { header: '주문 ID', accessor: 'id' },
              { header: '출하 상품명', accessor: 'item' },
              { header: '현재 진행 상태', accessor: 'status' }
            ]}
            data={mockList}
          />
        </Card>
      </div>
    </div>
  );
}
