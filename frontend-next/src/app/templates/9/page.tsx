'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from '../../../contexts/ModalContext';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { DataTable, Column } from '../../../components/common/DataTable';
import { InputField, SelectField, DatePicker } from '../../../components/common/FormFields';
import { SourceCodeViewer } from '../../../components/common/SourceCodeViewer';
import { Search, Truck, Save, CheckCircle2 } from 'lucide-react';
import '../../dispatch/allocation/Allocation.css'; 

interface AllocationMock {
  id: number;
  refNo: string;
  customer: string;
  origin: string;
  destination: string;
  targetDate: string;
  priority: 'High' | 'Medium' | 'Low';
}

export default function Template9Page() {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedVehicle, setSelectedVehicle] = useState('');

  const mockOrders: AllocationMock[] = [
    { id: 1, refNo: 'ORD-202311-001', customer: 'Samsung Electronics', origin: 'Suwon', destination: 'Pyeongtaek', targetDate: '2023-11-25', priority: 'High' },
    { id: 2, refNo: 'ORD-202311-002', customer: 'LG Energy Solution', origin: 'Ochang', destination: 'Nanjing', targetDate: '2023-11-26', priority: 'Medium' },
    { id: 3, refNo: 'ORD-202311-003', customer: 'SK Hynix', origin: 'Icheon', destination: 'Cheongju', targetDate: '2023-11-25', priority: 'Low' },
    { id: 4, refNo: 'ORD-202311-004', customer: 'Hyundai Mobis', origin: 'Ulsan', destination: 'Seoul', targetDate: '2023-11-27', priority: 'High' },
  ];

  const columns: Column<AllocationMock>[] = [
    {
      header: (
        <input 
          type="checkbox" 
          checked={selectedIds.size === mockOrders.length}
          onChange={(e) => {
            if (e.target.checked) setSelectedIds(new Set(mockOrders.map(o => o.id)));
            else setSelectedIds(new Set());
          }}
          aria-label="Select all"
        />
      ),
      accessor: (row) => (
        <input 
          type="checkbox" 
          checked={selectedIds.has(row.id)}
          onChange={() => {
            const next = new Set(selectedIds);
            if (next.has(row.id)) next.delete(row.id);
            else next.add(row.id);
            setSelectedIds(next);
          }}
          aria-label={`Select ${row.refNo}`}
        />
      ),
      colWidth: '50px',
      align: 'center'
    },
    { header: t('common.ref_no', '참조번호'), accessor: 'refNo', colWidth: '150px' },
    { header: t('common.customer', '고객사'), accessor: 'customer', colWidth: '150px' },
    { header: t('common.destination', '목적지'), accessor: 'destination' },
    { 
      header: t('common.priority', '우선순위'), 
      accessor: (row) => (
        <span className={`priority-tag ${row.priority.toLowerCase()}`}>
          {row.priority}
        </span>
      ),
      colWidth: '100px',
      align: 'center'
    }
  ];

  const handleAllocate = () => {
    showConfirm({
      title: 'Allocation Confirm',
      message: `${selectedIds.size} orders will be allocated to the selected vehicle. Proceed?`,
      onConfirm: () => showAlert({ title: 'Success', message: 'Allocation completed successfully.' })
    });
  };

  return (
    <div className="template-page fade-in p-6">
      <PageHeader 
        title="Template 9: Dispatch Allocation (4-Col Grid)" 
        description="배차 관리와 같은 4열 그리드 필터와 좌우 분할 액션 패널 구성입니다."
        breadcrumbs={['Templates', 'Dispatch Pattern']}
      />

      <div className="allocation-grid mt-6">
        {/* Left: Search & List */}
        <div className="allocation-orders-section flex flex-col gap-24">
          <Card title="Order Search (Standard 4-Col Grid)" collapsible>
            <div className="filter-panel horizontal grid-4 text-secondary">
              <InputField label="Order No" placeholder="Search..." fullWidth={false} />
              <InputField label="Customer" placeholder="Search..." fullWidth={false} />
              <DatePicker label="Delivery Date" selected={new Date()} onChange={() => {}} fullWidth={false} />
              <div className="filter-actions">
                <button className="btn btn-primary w-full"><Search size={18} /> {t('common.search', '조회')}</button>
              </div>
            </div>
          </Card>

          <Card title="Pending Orders" noPadding>
            <DataTable columns={columns} data={mockOrders} />
          </Card>
        </div>

        {/* Right: Action Panel */}
        <div className="allocation-panel">
          <Card title="Allocation Control" bodyClassName="p-20">
            <div className="allocation-summary-box mb-20 bg-primary-light p-16 rounded-lg border border-primary-fade">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-secondary">Selected Orders</span>
                <span className="text-xl font-bold text-primary">{selectedIds.size} Cases</span>
              </div>
            </div>

            <div className="text-secondary">
              <SelectField 
                label="Select Vehicle"
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                options={[
                  { value: '', label: 'Select a vehicle...' },
                  { value: '1', label: 'Truck 01 (5 Ton) - John Doe' },
                  { value: '2', label: 'Truck 02 (11 Ton) - Jane Smith' },
                ]}
              />
            </div>

            {selectedVehicle && (
              <div className="mt-20 p-16 rounded-lg border border-dashed border-slate-300">
                <div className="flex items-center gap-8 mb-8 text-primary font-bold">
                  <CheckCircle2 size={16} /> Vehicle Assigned
                </div>
                <div className="text-sm text-secondary space-y-4">
                  <div className="flex justify-between"><span>Driver:</span> <strong>John Doe</strong></div>
                  <div className="flex justify-between"><span>Contact:</span> <strong>010-1234-5678</strong></div>
                </div>
              </div>
            )}

            <button 
              className="btn btn-primary w-full mt-24 py-16 text-lg"
              disabled={selectedIds.size === 0 || !selectedVehicle}
              onClick={handleAllocate}
            >
              <Save size={20} className="mr-8" /> Confirm Allocation
            </button>
          </Card>

          <Card title="Quick Info" className="mt-24">
            <div className="flex items-start gap-12 text-sm text-secondary">
              <Truck size={24} className="text-primary shrink-0" />
              <p className="text-secondary">Drag and drop orders to prioritize or re-sequence delivery routes (Mock visualization).</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6">
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
  "import { Search, Truck, Save, CheckCircle2 } from 'lucide-react';",
  "import '../../dispatch/allocation/Allocation.css'; ",
  "",
  "export default function Template9Page() {",
  "  const { t } = useTranslation();",
  "  const { showAlert, showConfirm } = useModal();",
  "  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());",
  "  const [selectedVehicle, setSelectedVehicle] = useState('');",
  "",
  "  return (",
  "    <div className=\"template-page fade-in p-6\">",
  "      <PageHeader ",
  "        title=\"Template 9: Dispatch Allocation (4-Col Grid)\" ",
  "        description=\"배차 관리와 같은 4열 그리드 필터와 좌우 분할 액션 패널 구성입니다.\"",
  "      />",
  "      <div className=\"allocation-grid mt-6\">",
  "        <div className=\"allocation-orders-section flex flex-col gap-24\">",
  "          <Card title=\"Order Search\">",
  "            <div className=\"filter-panel horizontal grid-4\">",
  "              <InputField label=\"Order No\" />",
  "              <InputField label=\"Customer\" />",
  "              <DatePicker label=\"Delivery Date\" />",
  "              <button className=\"btn btn-primary\"><Search size={18} /> 조회</button>",
  "            </div>",
  "          </Card>",
  "          <Card title=\"Pending Orders\" noPadding><DataTable columns={columns} data={mockOrders} /></Card>",
  "        </div>",
  "        <div className=\"allocation-panel\">",
  "          <Card title=\"Allocation Control\">",
  "             <SelectField label=\"Select Vehicle\" options={...} />",
  "             <button className=\"btn btn-primary w-full\" onClick={handleAllocate}><Save size={20} /> Confirm</button>",
  "          </Card>",
  "        </div>",
  "      </div>",
  "      <SourceCodeViewer code={sourceCode} />",
  "    </div>",
  "  );",
  "}"
].join('\n');
