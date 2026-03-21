'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from '@/contexts/ModalContext';
import { ActionButtons } from '@/components/common/ActionButtons';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { DataTable, Column } from '@/components/common/DataTable';
import { InputField, SelectField } from '@/components/common/FormFields';
import { SourceCodeViewer } from '@/components/common/SourceCodeViewer';
import { Search, Save, Package, Info, ChevronRight, Edit3, RotateCcw } from 'lucide-react';
import './Template4_SplitView.css';

// Mock Data Structure
interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  baseQty: number;
  unit: string;
  description: string;
}

const productItems: ProductItem[] = [
  { id: '1', sku: 'PRD-X100', name: 'Logistics Box Medium', category: 'Packing', baseQty: 1500, unit: 'EA', description: 'Standard shipping box for medium items.' },
  { id: '2', sku: 'PRD-X200', name: 'Stretch Film Clear', category: 'Packing', baseQty: 450, unit: 'Roll', description: 'Industrial grade stretch film.' },
  { id: '3', sku: 'PRD-S500', name: 'Security Seal Blue', category: 'Security', baseQty: 10000, unit: 'EA', description: 'Tamper-evident security seals.' },
  { id: '4', sku: 'PRD-P800', name: 'Wooden Pallet Standard', category: 'Storage', baseQty: 80, unit: 'EA', description: 'Standard EUR-pallet dimensions.' },
  { id: '5', sku: 'PRD-L120', name: 'Shipping Label A5', category: 'Labeling', baseQty: 5000, unit: 'Sheet', description: 'A5 thermal transfer labels.' },
];

// Sub-component for Detail View to ensure clean re-renders with key
const ProductDetail = ({ item, onSave }: { item: ProductItem, onSave: () => void }) => {
  const { t } = useTranslation();
  
  return (
    <div className="detail-view-container animate-slide-in">
      <div className="detail-section-title mb-16 pb-8 border-bottom flex items-center gap-8 text-secondary font-bold">
        <Info size={16} /> Basic Specifications
      </div>
      
      <div className="grid grid-cols-2 gap-24">
        <InputField 
          label="Product ID (SKU)" 
          defaultValue={item.sku} 
          readOnly 
          className="bg-slate-50"
        />
        <SelectField 
          label="Category" 
          defaultValue={item.category.toLowerCase()} 
          options={[
            { value: 'packing', label: 'Packing' },
            { value: 'security', label: 'Security' },
            { value: 'storage', label: 'Storage' },
            { value: 'labeling', label: 'Labeling' },
          ]} 
        />
        <InputField label="Product Name" defaultValue={item.name} />
        <div className="grid grid-cols-2 gap-12">
          <InputField label="Base Quantity" defaultValue={item.baseQty.toString()} type="number" />
          <InputField label="Unit" defaultValue={item.unit} />
        </div>
      </div>

      <div className="mt-24">
        <div className="form-field-group">
          <label className="form-label">Description</label>
          <textarea 
            className="form-input min-h-100 p-8 border rounded-md w-full bg-white text-secondary" 
            defaultValue={item.description}
            placeholder="Enter detailed description..."
            aria-label="Description"
          />
        </div>
      </div>

      <div className="detail-meta mt-32 p-16 rounded-lg bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-8 mb-8 text-xs font-bold text-tertiary uppercase tracking-wider">
          <Edit3 size={12} /> Revision History
        </div>
        <div className="text-sm text-secondary">
          Last updated by <strong>Admin</strong> on 2023-11-21 15:45
        </div>
      </div>

      <ActionButtons className="mt-24">
        <button className="btn btn-outline" onClick={() => {}}>
          <RotateCcw size={18} /> {t('common.reset', '초기화')}
        </button>
        <button className="btn btn-primary" onClick={onSave}>
          <Save size={18} /> {t('common.save', '저장')}
        </button>
      </ActionButtons>
    </div>
  );
};

export default function Template4Page() {
  const { t } = useTranslation();
  const { showAlert } = useModal();
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(productItems[0]);

  const columns: Column<ProductItem>[] = [
    { header: t('common.sku', 'SKU'), accessor: 'sku', colWidth: '120px' },
    { header: t('common.name', '품명'), accessor: 'name' },
    { 
      header: '', 
      accessor: () => <ChevronRight size={16} className="text-tertiary" />,
      colWidth: '40px',
      align: 'center'
    }
  ];

  const handleSave = () => {
    showAlert({ title: t('common.notifications'), message: 'Changes saved successfully (Template Pattern).' });
  };

  return (
    <div className="template-page fade-in template4-split-view-page">
      <PageHeader 
        title="Template 4: Split Content View" 
        description="좌측 목록에서 항목을 선택하여 우측에서 상세 내용을 빠르게 확인하고 편집하는 마스터-디테일 패턴입니다."
        breadcrumbs={['Templates', 'Split View']}
      />

      <div className="split-view-container text-secondary">
        {/* Left: Master List Card */}
        <Card title={t('common.product_list', '품목 목록')} noPadding className="split-view-left">
          <div className="search-area-wrapper border-bottom bg-slate-50">
            <div className="flex gap-24 items-center search-bar-container">
              <InputField 
                label=""
                placeholder={t('common.search_placeholder', 'Search SKU or Name...')} 
                className="mb-0 no-label flex-1"
                fullWidth 
              />
              <button className="btn btn-primary btn-icon search-button" title="Search">
                <Search size={22} />
              </button>
            </div>
          </div>
          <div className="split-view-left-content">
            <DataTable 
              columns={columns} 
              data={productItems} 
              onRowClick={(row) => setSelectedItem(row)}
              selectedRowId={selectedItem?.id}
            />
          </div>
        </Card>

        {/* Right: Detailed Edit Form Card */}
        <Card 
          title={selectedItem ? (
            <div className="flex items-center gap-8 text-secondary">
              <Package size={18} className="text-primary" />
              <span>{selectedItem.name} {t('common.detail_info', '상세 정보')}</span>
            </div>
          ) : t('common.select_item_msg', '항목을 선택해주세요')}
          className="split-view-right"
        >
          {selectedItem ? (
            <ProductDetail key={selectedItem.id} item={selectedItem} onSave={handleSave} />
          ) : (
            <div className="empty-detail-view flex flex-col items-center justify-center h-full text-tertiary">
              <Package size={48} className="mb-16 opacity-20" />
              <p>{t('common.no_item_selected_msg', '좌측 목록에서 항목을 선택하여 상세 내용을 확인하세요.')}</p>
            </div>
          )}
        </Card>
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
  "import { useModal } from '@/contexts/ModalContext';",
  "import { ActionButtons } from '@/components/common/ActionButtons';",
  "import { PageHeader } from '@/components/common/PageHeader';",
  "import { Card } from '@/components/common/Card';",
  "import { DataTable, Column } from '@/components/common/DataTable';",
  "import { InputField, SelectField } from '@/components/common/FormFields';",
  "import { SourceCodeViewer } from '@/components/common/SourceCodeViewer';",
  "import { Search, Save, Package, Info, ChevronRight, Edit3, RotateCcw } from 'lucide-react';",
  "import './Template4_SplitView.css';",
  "",
  "// Mock Data Structure",
  "interface ProductItem {",
  "  id: string;",
  "  sku: string;",
  "  name: string;",
  "  category: string;",
  "  baseQty: number;",
  "  unit: string;",
  "  description: string;",
  "}",
  "",
  "const productItems: ProductItem[] = [",
  "  { id: '1', sku: 'PRD-X100', name: 'Logistics Box Medium', category: 'Packing', baseQty: 1500, unit: 'EA', description: 'Standard shipping box for medium items.' },",
  "  { id: '2', sku: 'PRD-X200', name: 'Stretch Film Clear', category: 'Packing', baseQty: 450, unit: 'Roll', description: 'Industrial grade stretch film.' },",
  "  { id: '3', sku: 'PRD-S500', name: 'Security Seal Blue', category: 'Security', baseQty: 10000, unit: 'EA', description: 'Tamper-evident security seals.' },",
  "  { id: '4', sku: 'PRD-P800', name: 'Wooden Pallet Standard', category: 'Storage', baseQty: 80, unit: 'EA', description: 'Standard EUR-pallet dimensions.' },",
  "  { id: '5', sku: 'PRD-L120', name: 'Shipping Label A5', category: 'Labeling', baseQty: 5000, unit: 'Sheet', description: 'A5 thermal transfer labels.' },",
  "];",
  "",
  "// Sub-component for Detail View to ensure clean re-renders with key",
  "const ProductDetail = ({ item, onSave }: { item: ProductItem, onSave: () => void }) => {",
  "  const { t } = useTranslation();",
  "  ",
  "  return (",
  "    <div className=\"detail-view-container animate-slide-in\">",
  "      <div className=\"detail-section-title mb-16 pb-8 border-bottom flex items-center gap-8 text-secondary font-bold\">",
  "        <Info size={16} /> Basic Specifications",
  "      </div>",
  "      ",
  "      <div className=\"grid grid-cols-2 gap-24\">",
  "        <InputField ",
  "          label=\"Product ID (SKU)\" ",
  "          defaultValue={item.sku} ",
  "          readOnly ",
  "          className=\"bg-slate-50\"",
  "        />",
  "        <SelectField ",
  "          label=\"Category\" ",
  "          defaultValue={item.category.toLowerCase()} ",
  "          options={[",
  "            { value: 'packing', label: 'Packing' },",
  "            { value: 'security', label: 'Security' },",
  "            { value: 'storage', label: 'Storage' },",
  "            { value: 'labeling', label: 'Labeling' },",
  "          ]} ",
  "        />",
  "        <InputField label=\"Product Name\" defaultValue={item.name} />",
  "        <div className=\"grid grid-cols-2 gap-12\">",
  "          <InputField label=\"Base Quantity\" defaultValue={item.baseQty.toString()} type=\"number\" />",
  "          <InputField label=\"Unit\" defaultValue={item.unit} />",
  "        </div>",
  "      </div>",
  "",
  "      <div className=\"mt-24\">",
  "        <div className=\"form-field-group\">",
  "          <label className=\"form-label\">Description</label>",
  "          <textarea ",
  "            className=\"form-input min-h-100 p-8 border rounded-md w-full bg-white text-secondary\" ",
  "            defaultValue={item.description}",
  "            placeholder=\"Enter detailed description...\"",
  "            aria-label=\"Description\"",
  "          />",
  "        </div>",
  "      </div>",
  "",
  "      <div className=\"detail-meta mt-32 p-16 rounded-lg bg-slate-50 border border-slate-200\">",
  "        <div className=\"flex items-center gap-8 mb-8 text-xs font-bold text-tertiary uppercase tracking-wider\">",
  "          <Edit3 size={12} /> Revision History",
  "        </div>",
  "        <div className=\"text-sm text-secondary\">",
  "          Last updated by <strong>Admin</strong> on 2023-11-21 15:45",
  "        </div>",
  "      </div>",
  "",
  "      <ActionButtons className=\"mt-24\">",
  "        <button className=\"btn btn-outline\" onClick={() => {}}>",
  "          <RotateCcw size={18} /> {t('common.reset', '초기화')}",
  "        </button>",
  "        <button className=\"btn btn-primary\" onClick={onSave}>",
  "          <Save size={18} /> {t('common.save', '저장')}",
  "        </button>",
  "      </ActionButtons>",
  "    </div>",
  "  );",
  "};",
  "",
  "export default function Template4Page() {",
  "  const { t } = useTranslation();",
  "  const { showAlert } = useModal();",
  "  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(productItems[0]);",
  "",
  "  const columns: Column<ProductItem>[] = [",
  "    { header: t('common.sku', 'SKU'), accessor: 'sku', colWidth: '120px' },",
  "    { header: t('common.name', '품명'), accessor: 'name' },",
  "    { ",
  "      header: '', ",
  "      accessor: () => <ChevronRight size={16} className=\"text-tertiary\" />,",
  "      colWidth: '40px',",
  "      align: 'center'",
  "    }",
  "  ];",
  "",
  "  const handleSave = () => {",
  "    showAlert({ title: t('common.notifications'), message: 'Changes saved successfully (Template Pattern).' });",
  "  };",
  "",
  "  return (",
  "    <div className=\"template-page fade-in template4-split-view-page\">",
  "      <PageHeader ",
  "        title=\"Template 4: Split Content View\" ",
  "        description=\"좌측 목록에서 항목을 선택하여 우측에서 상세 내용을 빠르게 확인하고 편집하는 마스터-디테일 패턴입니다.\"",
  "        breadcrumbs={['Templates', 'Split View']}",
  "      />",
  "",
  "      <div className=\"split-view-container text-secondary\">",
  "        {/* Left: Master List Card */}",
  "        <Card title={t('common.product_list', '품목 목록')} noPadding className=\"split-view-left\">",
  "          <div className=\"search-area-wrapper border-bottom bg-slate-50\">",
  "            <div className=\"flex gap-24 items-center search-bar-container\">",
  "              <InputField ",
  "                label=\"\"",
  "                placeholder={t('common.search_placeholder', 'Search SKU or Name...')} ",
  "                className=\"mb-0 no-label flex-1\"",
  "                fullWidth ",
  "              />",
  "              <button className=\"btn btn-primary btn-icon search-button\" title=\"Search\">",
  "                <Search size={22} />",
  "              </button>",
  "            </div>",
  "          </div>",
  "          <div className=\"split-view-left-content\">",
  "            <DataTable ",
  "              columns={columns} ",
  "              data={productItems} ",
  "              onRowClick={(row) => setSelectedItem(row)}",
  "              selectedRowId={selectedItem?.id}",
  "            />",
  "          </div>",
  "        </Card>",
  "",
  "        {/* Right: Detailed Edit Form Card */}",
  "        <Card ",
  "          title={selectedItem ? (",
  "            <div className=\"flex items-center gap-8 text-secondary\">",
  "              <Package size={18} className=\"text-primary\" />",
  "              <span>{selectedItem.name} {t('common.detail_info', '상세 정보')}</span>",
  "            </div>",
  "          ) : t('common.select_item_msg', '항목을 선택해주세요')}",
  "          className=\"split-view-right\"",
  "        >",
  "          {selectedItem ? (",
  "            <ProductDetail key={selectedItem.id} item={selectedItem} onSave={handleSave} />",
  "          ) : (",
  "            <div className=\"empty-detail-view flex flex-col items-center justify-center h-full text-tertiary\">",
  "              <Package size={48} className=\"mb-16 opacity-20\" />",
  "              <p>{t('common.no_item_selected_msg', '좌측 목록에서 항목을 선택하여 상세 내용을 확인하세요.')}</p>",
  "            </div>",
  "          )}",
  "        </Card>",
  "      </div>",
  "",
  "      <div className=\"mt-6\">",
  "        <SourceCodeViewer code={sourceCode} />",
  "      </div>",
  "    </div>",
  "  );",
  "}",
].join('\n');
