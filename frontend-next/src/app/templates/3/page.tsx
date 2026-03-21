'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from '@/contexts/ModalContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { InputField, SelectField, DatePicker } from '@/components/common/FormFields';
import { ActionButtons } from '@/components/common/ActionButtons';
import { SourceCodeViewer } from '@/components/common/SourceCodeViewer';
import { Save, X, RotateCcw } from 'lucide-react';
import './Template3_CreateEditForm.css';

export default function Template3Page() {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();

  const handleSave = () => {
    showConfirm({
      title: t('common.save_confirm', '저장 확인'),
      message: t('msg.save_proceed_msg', '입력한 정보를 저장하시겠습니까?'),
      onConfirm: () => showAlert({ 
        title: t('common.success'), 
        message: t('msg.save_success') 
      })
    });
  };

  const handleReset = () => {
    // Reset logic here
  };

  return (
    <div className="template-page fade-in p-6">
      <PageHeader 
        title="품목 마스터 등록 (Create/Edit Form)" 
        description="신규 항목을 등록하거나 기존 정보를 수정하는 상세 입력 폼입니다."
        breadcrumbs={['템플릿', '등록/수정 폼']}
      />

      <div className="template3-form-container mt-6 text-secondary">
        <Card title="기본 정보" collapsible>
          <div className="grid grid-cols-2 gap-24">
            <InputField label="품목 코드" placeholder="자동 생성 (시스템ID)" readOnly />
            <InputField label="품목명" placeholder="품목명을 입력하세요" required />
            <SelectField label="카테고리" options={[
              { value: 'box', label: 'Box/Packaging' },
              { value: 'film', label: 'Stretch Film' },
              { value: 'seal', label: 'Security Seal' },
            ]} />
            <DatePicker label="등록 예정일" selected={new Date()} onChange={() => {}} />
          </div>
        </Card>

        <Card title="물류 속성 정보" collapsible>
          <div className="grid grid-cols-2 gap-24">
            <InputField label="가로(mm)" type="number" placeholder="0" />
            <InputField label="세로(mm)" type="number" placeholder="0" />
            <InputField label="높이(mm)" type="number" placeholder="0" />
            <InputField label="중량(kg)" type="number" placeholder="0.0" />
            <SelectField label="보관 유형" options={[
              { value: 'dry', label: '상온' },
              { value: 'cold', label: '냉장' },
              { value: 'frozen', label: '냉동' },
            ]} />
            <InputField label="최소 재고량" type="number" placeholder="100" />
          </div>
        </Card>

        <Card title="비고 및 관리 메모">
          <div className="form-field-group">
            <label className="form-label" htmlFor="memo-textarea">비고 (Notes)</label>
            <textarea 
              id="memo-textarea"
              className="form-input min-h-120 p-8 border rounded-md w-full bg-white text-secondary" 
              placeholder="특이사항이나 관리 메모를 입력하세요..."
              aria-label="Notes"
            ></textarea>
          </div>
        </Card>

        <ActionButtons className="mt-8">
          <button className="btn btn-outline" onClick={handleReset}>
            <RotateCcw size={18} /> {t('common.reset', '초기화')}
          </button>
          <button className="btn btn-outline" onClick={() => window.history.back()}>
            <X size={18} /> {t('common.cancel', '취소')}
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={18} /> {t('common.save', '저장')}
          </button>
        </ActionButtons>

        <div className="mt-6">
          <SourceCodeViewer code={sourceCode} />
        </div>
      </div>
    </div>
  );
}

const sourceCode = [
  "'use client';",
  "",
  "import React from 'react';",
  "import { useTranslation } from 'react-i18next';",
  "import { useModal } from '@/contexts/ModalContext';",
  "import { PageHeader } from '@/components/common/PageHeader';",
  "import { Card } from '@/components/common/Card';",
  "import { InputField, SelectField, DatePicker } from '@/components/common/FormFields';",
  "import { ActionButtons } from '@/components/common/ActionButtons';",
  "import { SourceCodeViewer } from '@/components/common/SourceCodeViewer';",
  "import { Save, X, RotateCcw } from 'lucide-react';",
  "import './Template3_CreateEditForm.css';",
  "",
  "export default function Template3Page() {",
  "  const { t } = useTranslation();",
  "  const { showAlert, showConfirm } = useModal();",
  "",
  "  const handleSave = () => { /* ... */ };",
  "  const handleReset = () => { /* ... */ };",
  "",
  "  return (",
  "    <div className=\"template-page fade-in p-6\">",
  "      <PageHeader title=\"품목 마스터 등록\" />",
  "      <div className=\"template3-form-container mt-6\">",
  "        <Card title=\"기본 정보\">{/* fields */}</Card>",
  "        <Card title=\"물류 속성 정보\">{/* fields */}</Card>",
  "",
  "        <ActionButtons className=\"mt-8\">",
  "          <button className=\"btn btn-outline\" onClick={handleReset}>최초화</button>",
  "          <button className=\"btn btn-outline\" onClick={...}>취소</button>",
  "          <button className=\"btn btn-primary\" onClick={handleSave}>저장</button>",
  "        </ActionButtons>",
  "      </div>",
  "    </div>",
  "  );",
  "}"
].join('\n');
