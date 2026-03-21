'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from '../../../contexts/ModalContext';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { DataTable, Column } from '../../../components/common/DataTable';
import { InputField, SelectField, DatePicker } from '../../../components/common/FormFields';
import { SourceCodeViewer } from '../../../components/common/SourceCodeViewer';
import { Search, Plus, Filter, Download, FileText, MoreHorizontal } from 'lucide-react';
import './Template1_ListSearch.css';

// Mock Data Structure
interface BusinessData {
  id: string;
  code: string;
  name: string;
  category: string;
  status: 'active' | 'inactive' | 'pending';
  amount: number;
  updatedAt: string;
  manager: string;
}

const mockData: BusinessData[] = [
  { id: '1', code: 'BUS-00124', name: 'Global Logistics Solution', category: 'LSP', status: 'active', amount: 4500000, updatedAt: '2023-11-20 14:30', manager: 'Admin' },
  { id: '2', code: 'BUS-00125', name: 'Fast Delivery Hub', category: 'Warehouse', status: 'pending', amount: 1200000, updatedAt: '2023-11-21 09:15', manager: 'User_01' },
  { id: '3', code: 'BUS-00126', name: 'Inland Transport Co.', category: 'Carrier', status: 'active', amount: 890000, updatedAt: '2023-11-19 16:45', manager: 'Admin' },
  { id: '4', code: 'BUS-00127', name: 'Safe Storage Inc.', category: 'Warehouse', status: 'inactive', amount: 0, updatedAt: '2023-11-20 11:20', manager: 'User_02' },
  { id: '5', code: 'BUS-00128', name: 'Oceanic Shipping Corp', category: 'Carrier', status: 'active', amount: 15600000, updatedAt: '2023-11-21 15:00', manager: 'Admin' },
];

export default function Template1Page() {
  const { t } = useTranslation();
  const { showInfo, showAlert } = useModal();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchDate, setSearchDate] = useState<Date | null>(new Date());

  const columns: Column<BusinessData>[] = [
    { header: t('common.code', '코드'), accessor: 'code', colWidth: '120px' },
    { header: t('common.name', '명칭'), accessor: 'name' },
    { header: t('common.category', '카테고리'), accessor: 'category', colWidth: '150px' },
    { 
      header: t('common.status', '상태'), 
      accessor: (row) => {
        const statusMap: Record<string, { label: string, color: string }> = {
          active: { label: t('common.active', '활성'), color: 'status-badge active' },
          inactive: { label: t('common.inactive', '비활성'), color: 'status-badge inactive' },
          pending: { label: t('common.pending', '대기'), color: 'status-badge pending' }
        };
        const { label, color } = statusMap[row.status];
        return <span className={color}>{label}</span>;
      },
      colWidth: '100px',
      align: 'center'
    },
    { 
      header: t('common.amount', '금액'), 
      accessor: (row) => row.amount.toLocaleString(),
      align: 'right',
      colWidth: '140px'
    },
    { header: t('common.updated_at', '최종수정일'), accessor: 'updatedAt', colWidth: '160px', align: 'center' },
    { 
      header: t('common.actions', '작업'), 
      accessor: () => (
        <button className="btn btn-ghost btn-xs" title="Details">
          <MoreHorizontal size={16} />
        </button>
      ),
      colWidth: '80px',
      align: 'center'
    }
  ];

  const handleExcelDownload = () => {
    showAlert({ title: t('common.notifications'), message: 'Excel download triggered (Template Pattern)' });
  };

  const headerActions = (
    <>
      <button className="btn btn-outline" onClick={handleExcelDownload}><Download size={18} /> {t('common.excel_download', '엑셀 다운로드')}</button>
      <button className="btn btn-primary"><Plus size={18} /> {t('common.new_register', '신규 등록')}</button>
    </>
  );

  return (
    <div className="template-page fade-in p-6">
      <PageHeader 
        title="Template 1: Standard List & Search" 
        description="가장 일반적인 5열 그리드 검색 필터와 데이터 목록 템플릿입니다." 
        breadcrumbs={['Templates', 'Standard List']}
        actions={headerActions}
      />

      <div className="template-container mt-6">
        {/* Search Filter Card - Standard 5 Column Grid */}
        <Card title={t('common.search_filter', '검색 조건')} collapsible>
          <div className="filter-panel horizontal grid-5">
            <InputField label={t('common.code', '코드')} placeholder="BUS-..." fullWidth={false} />
            <InputField label={t('common.name', '명칭')} placeholder="Search name..." fullWidth={false} />
            <SelectField label={t('common.category', '카테고리')} options={[
              { value: '', label: 'All' },
              { value: 'lsp', label: 'LSP' },
              { value: 'carrier', label: 'Carrier' },
              { value: 'warehouse', label: 'Warehouse' },
            ]} fullWidth={false} />
            <DatePicker 
              label={t('common.target_date', '대상 일자')} 
              selected={searchDate} 
              onChange={setSearchDate} 
              fullWidth={false}
            />
            <div className="filter-actions">
              <button className="btn btn-primary"><Search size={18} /> {t('common.search', '조회')}</button>
            </div>
          </div>
        </Card>

        {/* Data List Card */}
        <Card noPadding>
          <div className="result-header p-24 pb-12 flex justify-between items-center">
            <h3 className="result-title text-lg font-bold">
              <FileText size={18} className="inline mr-8 text-primary" />
              {t('common.search_results', '조회 결과')} <span className="text-primary ml-4">({mockData.length})</span>
            </h3>
            <button className="btn btn-ghost btn-sm text-secondary">
              <Filter size={14} className="mr-4" /> {t('common.filter_settings', '보기 설정')}
            </button>
          </div>
          <DataTable 
            columns={columns} 
            data={mockData} 
            onRowClick={(row) => showInfo({ 
              title: t('common.info'), 
              message: t('msg.row_selected'), 
              messageValues: [row.name] 
            })}
            pagination={{
              currentPage,
              totalPages: 5,
              onPageChange: setCurrentPage
            }}
          />
        </Card>

        <SourceCodeViewer code={sourceCode} />
      </div>
    </div>
  );
}

const sourceCode = [
  "'use client';",
  "",
  "import React, { useState } from 'react';",
  "import { useTranslation } from 'react-i18next';",
  "import { useModal } from '../../../contexts/ModalContext';",
  "import { PageHeader } from '../../../components/common/PageHeader';",
  "import { Card } from '../../../components/common/Card';",
  "import { DataTable, Column } from '../../../components/common/DataTable';",
  "import { InputField, SelectField, DatePicker } from '../../../components/common/FormFields';",
  "import { SourceCodeViewer } from '../../../components/common/SourceCodeViewer';",
  "import { Search, Plus, Filter, Download, FileText, MoreHorizontal } from 'lucide-react';",
  "import './Template1_ListSearch.css';",
  "",
  "export default function Template1Page() {",
  "  const { t } = useTranslation();",
  "  const { showInfo, showAlert } = useModal();",
  "  const [currentPage, setCurrentPage] = useState(1);",
  "  const [searchDate, setSearchDate] = useState<Date | null>(new Date());",
  "",
  "  const columns: Column<BusinessData>[] = [",
  "    { header: t('common.code'), accessor: 'code', colWidth: '120px' },",
  "    { header: t('common.name'), accessor: 'name' },",
  "    // ... (rest of columns)",
  "  ];",
  "",
  "  return (",
  "    <div className=\"template-page fade-in p-6\">",
  "      <PageHeader ",
  "        title=\"Template 1: Standard List & Search\" ",
  "        description=\"가장 일반적인 5열 그리드 검색 필터와 데이터 목록 템플릿입니다.\" ",
  "        breadcrumbs={['Templates', 'Standard List']}",
  "        actions={headerActions}",
  "      />",
  "",
  "      <div className=\"template-container mt-6\">",
  "        <Card title={t('common.search_filter')} collapsible>",
  "          <div className=\"filter-panel horizontal grid-5\">",
  "            <InputField label={t('common.code')} placeholder=\"BUS-...\" />",
  "            <InputField label={t('common.name')} placeholder=\"Search name...\" />",
  "            <SelectField label={t('common.category')} options={[...]} />",
  "            <DatePicker label={t('common.target_date')} selected={searchDate} onChange={setSearchDate} />",
  "            <div className=\"filter-actions\">",
  "              <button className=\"btn btn-primary\"><Search size={18} /> {t('common.search')}</button>",
  "            </div>",
  "          </div>",
  "        </Card>",
  "",
  "        <Card noPadding>",
  "          <DataTable columns={columns} data={mockData} pagination={{...}} />",
  "        </Card>",
  "      </div>",
  "    </div>",
  "  );",
  "}"
].join('\n');
