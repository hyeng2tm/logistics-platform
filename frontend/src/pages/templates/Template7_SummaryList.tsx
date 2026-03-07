import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { DataTable } from '../../components/common/DataTable';
import { Package, Truck, AlertTriangle } from 'lucide-react';

const mockList = [
  { id: '1', item: '엔진 오일 BOX', status: '출하 대기중' },
  { id: '2', item: '기어 파츠 B형', status: '상차 완료' },
  { id: '3', item: '브레이크 패드', status: '지연' },
];

const Template7_SummaryList: React.FC = () => {
  return (
    <div className="template-page fade-in">
      <PageHeader 
        title="출하 센터 모니터링 (요약 + 목록 뷰)" 
        description="상단에서 현재 출하장의 요약 통계를 보고, 하단에서 상세 목록을 확인합니다."
        breadcrumbs={['템플릿', '요약 포함 목록']}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Summary Widgets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          <Card className="summary-widget">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(67, 24, 255, 0.1)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>총 출하 지시 건수</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>1,430건</div>
              </div>
            </div>
          </Card>
          
          <Card className="summary-widget">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(5, 205, 153, 0.1)', color: '#05CD99', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>상차/이동 완료</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>920건</div>
              </div>
            </div>
          </Card>

          <Card className="summary-widget">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 90, 95, 0.1)', color: '#FF5A5F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>출하 이상 발생 (지연/누락)</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>12건</div>
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
};

export default Template7_SummaryList;
