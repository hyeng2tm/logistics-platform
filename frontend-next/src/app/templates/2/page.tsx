'use client';

import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { SourceCodeViewer } from '../../../components/common/SourceCodeViewer';
import './Template2_DetailView.css';

export default function Template2Page() {
  useTranslation();

  return (
    <div className="template-page fade-in p-6">
      <PageHeader 
        title="거래처 상세 정보 (카드형 상세 뷰)" 
        description="특정 항목의 상세 정보를 카드 레이아웃으로 구조화하여 보여줍니다."
        breadcrumbs={['템플릿', '상세 정보 뷰']}
      />

      <div className="template2-detail-view-container mt-6">
        <Card title="기본 통계 및 상태">
          <div className="detail-header-section">
            <div className="detail-badge-container">
              <span className="status-badge active">정상 거래중</span>
              <span className="status-badge pending">한도 초과 주의</span>
            </div>
            <div className="text-right">
              <div className="info-label text-secondary">최종 동기화 시점</div>
              <div className="info-value text-primary font-bold">2023-11-21 15:45:01</div>
            </div>
          </div>
        </Card>

        <Card title="사업자 및 담당자 상세 내역">
          <div className="detail-grid text-secondary">
            <div className="info-group">
              <div className="info-item">
                <div className="info-label">사업자 번호</div>
                <div className="info-value">123-45-67890</div>
              </div>
              <div className="info-item">
                <div className="info-label">대표자명</div>
                <div className="info-value">홍길동</div>
              </div>
              <div className="info-item">
                <div className="info-label">주소</div>
                <div className="info-value">서울특별시 구로구 디지털로 300, 10층</div>
              </div>
            </div>

            <div className="info-group">
              <div className="info-item">
                <div className="info-label">주요 연락처</div>
                <div className="info-value">02-1234-5678</div>
              </div>
              <div className="info-item">
                <div className="info-label">이메일</div>
                <div className="info-value">contact@example.com</div>
              </div>
              <div className="info-item">
                <div className="info-label">결제 조건</div>
                <div className="info-value">익월 15일 현금 결제</div>
              </div>
            </div>
          </div>

          <div className="detail-footer-actions">
            <button className="btn btn-outline">이력 보기</button>
            <button className="btn btn-primary">정보 수정</button>
          </div>
        </Card>

        <SourceCodeViewer code={sourceCode} />
      </div>
    </div>
  );
}

const sourceCode = [
  "'use client';",
  "",
  "import { useTranslation } from 'react-i18next';",
  "import { PageHeader } from '../../../components/common/PageHeader';",
  "import { Card } from '../../../components/common/Card';",
  "import { SourceCodeViewer } from '../../../components/common/SourceCodeViewer';",
  "import './Template2_DetailView.css';",
  "",
  "export default function Template2Page() {",
  "  useTranslation();",
  "",
  "  return (",
  "    <div className=\"template-page fade-in p-6\">",
  "      <PageHeader title=\"거래처 상세 정보\" breadcrumbs={['템플릿', '상세 정보 뷰']} />",
  "      <div className=\"template2-detail-view-container mt-6\">",
  "        <Card title=\"기본 통계 및 상태\">",
  "          <div className=\"detail-header-section\">",
  "            <span className=\"status-badge active\">정상 거래중</span>",
  "            <div className=\"text-right\">",
  "              <div className=\"info-label\">최종 동기화 시점</div>",
  "              <div className=\"info-value text-primary font-bold\">2023-11-21 15:45:01</div>",
  "            </div>",
  "          </div>",
  "        </Card>",
  "        <Card title=\"사업자 및 담당자 상세 내역\">",
  "          <div className=\"detail-grid\">",
  "            <div className=\"info-group\">",
  "              <div className=\"info-item\"><div className=\"info-label\">사업자 번호</div><div className=\"info-value\">123-45-67890</div></div>",
  "            </div>",
  "            {/* ... other info groups */}",
  "          </div>",
  "          <div className=\"detail-footer-actions\">",
  "            <button className=\"btn btn-primary\">정보 수정</button>",
  "          </div>",
  "        </Card>",
  "        <SourceCodeViewer code={sourceCode} />",
  "      </div>",
  "    </div>",
  "  );",
  "}"
].join('\n');
