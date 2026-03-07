import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Edit2, Printer, Trash2, ArrowLeft } from 'lucide-react';

const Template2_DetailView: React.FC = () => {
  const headerActions = (
    <>
      <button className="btn btn-outline" style={{ color: '#FF5A5F', borderColor: '#FF5A5F' }}>
        <Trash2 size={16} /> 삭제
      </button>
      <button className="btn btn-outline"><Printer size={16} /> 인쇄</button>
      <button className="btn btn-primary"><Edit2 size={16} /> 수정하기</button>
    </>
  );

  return (
    <div className="template-page fade-in">
      <PageHeader 
        title="배송 상세 정보 (TRK-98231)" 
        description="배송 건에 대한 상세한 내역을 조회합니다."
        breadcrumbs={['템플릿', '기본 상세 (Detail View)']}
        actions={headerActions}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <button className="btn btn-outline" style={{ alignSelf: 'flex-start', padding: '6px 12px', border: 'none' }}>
          <ArrowLeft size={16} /> 목록으로 돌아가기
        </button>

        {/* Info Grid Card */}
        <Card title="기본 정보">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
             <div className="info-row">
               <span className="info-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>배송번호</span>
               <div className="info-value" style={{ fontWeight: 600 }}>TRK-98231</div>
             </div>
             <div className="info-row">
               <span className="info-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>등록일자</span>
               <div className="info-value" style={{ fontWeight: 600 }}>2023-11-20 14:30:00</div>
             </div>
             <div className="info-row">
               <span className="info-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>담당자</span>
               <div className="info-value" style={{ fontWeight: 600 }}>김물류 대리</div>
             </div>
             <div className="info-row">
               <span className="info-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>현재 상태</span>
               <div className="info-value" style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>배송중</div>
             </div>
          </div>
        </Card>

        {/* Additional Detail Card */}
        <Card title="고객 정보">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
             <div className="info-row" style={{ gridColumn: '1 / -1' }}>
               <span className="info-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>목적지 주소</span>
               <div className="info-value" style={{ fontWeight: 600 }}>서울특별시 강남구 테헤란로 123, 4층 물류팀</div>
             </div>
             <div className="info-row">
               <span className="info-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>수령인</span>
               <div className="info-value" style={{ fontWeight: 600 }}>홍길동</div>
             </div>
             <div className="info-row">
               <span className="info-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>연락처</span>
               <div className="info-value" style={{ fontWeight: 600 }}>010-1234-5678</div>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Template2_DetailView;
