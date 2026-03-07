import React, { useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { DataTable, Column } from '../../components/common/DataTable';
import { InputField, SelectField } from '../../components/common/FormFields';
import { Search, Plus, Filter, Download } from 'lucide-react';
import './Template1_ListSearch.css';

// Mock Data
interface ShipmentData {
  id: string;
  trackingNumber: string;
  status: string;
  destination: string;
  date: string;
}

const mockData: ShipmentData[] = [
  { id: '1', trackingNumber: 'TRK-98231', status: '배송중', destination: '서울 강남구', date: '2023-11-20' },
  { id: '2', trackingNumber: 'TRK-98232', status: '준비중', destination: '부산 해운대구', date: '2023-11-21' },
  { id: '3', trackingNumber: 'TRK-98233', status: '완료', destination: '대구 수성구', date: '2023-11-19' },
  { id: '4', trackingNumber: 'TRK-98234', status: '배송중', destination: '인천 연수구', date: '2023-11-20' },
];

const columns: Column<ShipmentData>[] = [
  { header: '배송번호', accessor: 'trackingNumber' },
  { header: '목적지', accessor: 'destination' },
  { header: '날짜', accessor: 'date' },
  { 
    header: '상태', 
    accessor: (row) => {
      const statusClass = row.status === '완료' ? 'completed' : row.status === '배송중' ? 'shipping' : 'preparing';
      return (
        <span className={`status-badge ${statusClass}`}>
          {row.status}
        </span>
      );
    }
  },
];

const Template1_ListSearch: React.FC = () => {
  
  const { showInfo } = useModal();
  const [currentPage, setCurrentPage] = useState(1);

  const headerActions = (
    <>
      <button className="btn btn-outline"><Download size={18} /> 엑셀 다운로드</button>
      <button className="btn btn-primary"><Plus size={18} /> 신규 등록</button>
    </>
  );

  return (
    <div className="template-page fade-in">
      <PageHeader 
        title="Template 1: List & Search" 
        description="가장 일반적인 목록 조회 및 검색 템플릿입니다."
        breadcrumbs={['템플릿', '기본 조회']}
        actions={headerActions}
      />

      <div className="template-container">
        {/* Search Filter Card */}
        <Card title="검색 조건" headerActions={<button className="btn btn-outline filter-reset-btn"><Filter size={16}/> 필터 초기화</button>}>
          <div className="filter-panel horizontal grid-5">
            <InputField label="배송번호" placeholder="TRK번호 입력..." fullWidth={false} />
            <InputField label="도착지" placeholder="주소 입력..." fullWidth={false} />
            <SelectField label="상태" options={[
              { value: '', label: '전체' },
              { value: 'preparing', label: '준비중' },
              { value: 'shipping', label: '배송중' },
              { value: 'completed', label: '완료' },
            ]} fullWidth={false} />
            <div className="filter-actions">
              <button className="btn btn-primary"><Search size={18} /> 조회하기</button>
            </div>
          </div>
        </Card>

        {/* Data List Card */}
        <Card noPadding>
          <div className="result-header">
            <h3 className="result-title">조회 결과 (총 4건)</h3>
          </div>
          <DataTable 
            columns={columns} 
            data={mockData} 
            onRowClick={(row) => showInfo({ 
              title: 'common.info', 
              message: 'msg.row_selected', 
              messageValues: [row.trackingNumber] 
            })}
            pagination={{
              currentPage,
              totalPages: 5,
              onPageChange: setCurrentPage
            }}
          />
        </Card>
      </div>
    </div>
  );
};

export default Template1_ListSearch;
