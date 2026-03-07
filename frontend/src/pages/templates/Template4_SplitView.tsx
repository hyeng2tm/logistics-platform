import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { DataTable, Column } from '../../components/common/DataTable';
import './Template4_SplitView.css';
import { InputField } from '../../components/common/FormFields';
import { Search } from 'lucide-react';

// Mock Data
interface Item {
  id: string;
  name: string;
  qty: number;
}
const items: Item[] = [
  { id: 'ITM-001', name: '물류 박스 A형', qty: 150 },
  { id: 'ITM-002', name: '완충재 롤', qty: 20 },
  { id: 'ITM-003', name: '보안씰', qty: 500 },
  { id: 'ITM-004', name: '목재 파렛트', qty: 8 },
];

const columns: Column<Item>[] = [
  { header: '품목 ID', accessor: 'id' },
  { header: '품명', accessor: 'name' },
];

const Template4_SplitView: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(items[0]);

  return (
    <div className="template-page fade-in template4-split-view-page">
      <PageHeader 
        title="품목 마스터 관리 (Split View)" 
        description="좌측 목록을 선택하여 우측에서 상세 내용을 빠르게 확인/수정합니다."
        breadcrumbs={['템플릿', '화면 분할 뷰']}
      />

      <div className="split-view-container">
        {/* Left: Master List */}
        <Card title="품목 목록" noPadding className="split-view-left">
          <div className="p-24 pb-0">
             <div className="filter-panel horizontal filter-panel-2col">
                <InputField label="품명" placeholder="품명 검색" fullWidth={false} />
                <div className="filter-actions">
                   <button className="btn btn-primary" title="검색"><Search size={16} /></button>
                </div>
             </div>
          </div>
          <div className="split-view-left-content">
            <DataTable 
              columns={columns} 
              data={items} 
              onRowClick={(row: Item) => setSelectedItem(row)}
            />
          </div>
        </Card>

        {/* Right: Detail View */}
        <Card title={selectedItem ? `${selectedItem.name} 상세 정보` : '항목을 선택해주세요'} className="split-view-right">
          {selectedItem ? (
            <div className="detail-view-container">
              <div className="detail-row">
                 <span className="detail-label">품목 ID</span>
                 <span>{selectedItem.id}</span>
              </div>
              <div className="detail-row">
                 <span className="detail-label">품명</span>
                 <input type="text" className="form-input" aria-label="품명" defaultValue={selectedItem.name} />
              </div>
              <div className="detail-row">
                 <span className="detail-label">현재고</span>
                 <span>{selectedItem.qty} 단위</span>
              </div>
              
              <div className="detail-actions">
                <button className="btn btn-primary">변경사항 저장</button>
              </div>
            </div>
          ) : (
            <div className="empty-detail-view">
              좌측 목록에서 항목을 클릭하세요.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Template4_SplitView;
