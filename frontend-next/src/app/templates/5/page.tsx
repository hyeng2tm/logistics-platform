'use client';

import React, { useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { SourceCodeViewer } from '../../../components/common/SourceCodeViewer';
import { Layout, Table, FormInput, MessageSquare } from 'lucide-react';
import './Template5_Tabbed.css';

export default function Template5Page() {
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <div className="template-page fade-in p-6">
      <PageHeader 
        title="시스템 모니터링 (Tabbed Dashboard)" 
        description="카테고리별로 정보를 탭으로 분리하여 복잡한 데이터를 체계적으로 관리합니다."
        breadcrumbs={['템플릿', '탭형 뷰']}
      />

      <div className="template5-tab-container mt-6">
        <div className="tab-menu-bar">
          <button 
            className={`tab-item ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
            title="Summary Tab"
          >
            <Layout size={18} /> 요약 정보
          </button>
          <button 
            className={`tab-item ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
            title="Details Tab"
          >
            <Table size={18} /> 상세 목록
          </button>
          <button 
            className={`tab-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            title="History Tab"
          >
            <FormInput size={18} /> 이력 관리
          </button>
          <button 
            className={`tab-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
            title="Logs Tab"
          >
            <MessageSquare size={18} /> 시스템 로그
          </button>
        </div>

        <div className="tab-content-area mt-4">
          {activeTab === 'summary' && (
            <div className="fade-in text-secondary">
              <Card title="운영 현황 요약">
                <div className="summary-grid">
                  <div className="stat-card">
                    <div className="stat-label">당일 배차율</div>
                    <div className="stat-value">98.5%</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">평균 배송 시간</div>
                    <div className="stat-value">4.2h</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">미처리 주문</div>
                    <div className="stat-value text-danger">5건</div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="fade-in text-secondary">
              <Card title="모니터링 상세">
                <p className="tab-content-desc">상세 목록 데이터가 여기에 표시됩니다.</p>
              </Card>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="fade-in text-secondary">
              <Card title="이력 정보">
                 <p className="tab-content-desc">변경 이력이 여기에 표시됩니다.</p>
              </Card>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="fade-in text-secondary">
              <Card title="시스템 로그">
                 <p className="tab-content-desc">로그 정보가 여기에 표시됩니다.</p>
              </Card>
            </div>
          )}
        </div>

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
  "import React, { useState } from 'react';",
  "import { PageHeader } from '../../../components/common/PageHeader';",
  "import { Card } from '../../../components/common/Card';",
  "import { SourceCodeViewer } from '../../../components/common/SourceCodeViewer';",
  "import { Layout, Table, FormInput, MessageSquare } from 'lucide-react';",
  "import './Template5_Tabbed.css';",
  "",
  "export default function Template5Page() {",
  "  const [activeTab, setActiveTab] = useState('summary');",
  "",
  "  return (",
  "    <div className=\"template-page fade-in p-6\">",
  "      <PageHeader ",
  "        title=\"시스템 모니터링 (Tabbed Dashboard)\" ",
  "        description=\"카테고리별로 정보를 탭으로 분리하여 복잡한 데이터를 체계적으로 관리합니다.\"",
  "        breadcrumbs={['템플릿', '탭형 뷰']}",
  "      />",
  "",
  "      <div className=\"template5-tab-container mt-6\">",
  "        <div className=\"tab-menu-bar\">",
  "          <button ",
  "            className={`tab-item ${activeTab === 'summary' ? 'active' : ''}`}",
  "            onClick={() => setActiveTab('summary')}",
  "            title=\"Summary Tab\"",
  "          >",
  "            <Layout size={18} /> 요약 정보",
  "          </button>",
  "          <button ",
  "            className={`tab-item ${activeTab === 'details' ? 'active' : ''}`}",
  "            onClick={() => setActiveTab('details')}",
  "            title=\"Details Tab\"",
  "          >",
  "            <Table size={18} /> 상세 목록",
  "          </button>",
  "          <button ",
  "            className={`tab-item ${activeTab === 'history' ? 'active' : ''}`}",
  "            onClick={() => setActiveTab('history')}",
  "            title=\"History Tab\"",
  "          >",
  "            <FormInput size={18} /> 이력 관리",
  "          </button>",
  "          <button ",
  "            className={`tab-item ${activeTab === 'logs' ? 'active' : ''}`}",
  "            onClick={() => setActiveTab('logs')}",
  "            title=\"Logs Tab\"",
  "          >",
  "            <MessageSquare size={18} /> 시스템 로그",
  "          </button>",
  "        </div>",
  "",
  "        <div className=\"tab-content-area mt-4\">",
  "          {activeTab === 'summary' && (",
  "            <div className=\"fade-in text-secondary\">",
  "              <Card title=\"운영 현황 요약\">",
  "                <div className=\"summary-grid\">",
  "                  <div className=\"stat-card\">",
  "                    <div className=\"stat-label\">당일 배차율</div>",
  "                    <div className=\"stat-value\">98.5%</div>",
  "                  </div>",
  "                  <div className=\"stat-card\">",
  "                    <div className=\"stat-label\">평균 배송 시간</div>",
  "                    <div className=\"stat-value\">4.2h</div>",
  "                  </div>",
  "                  <div className=\"stat-card\">",
  "                    <div className=\"stat-label\">미처리 주문</div>",
  "                    <div className=\"stat-value text-danger\">5건</div>",
  "                  </div>",
  "                </div>",
  "              </Card>",
  "            </div>",
  "          )}",
  "",
  "          {activeTab === 'details' && (",
  "            <div className=\"fade-in text-secondary\">",
  "              <Card title=\"모니터링 상세\">",
  "                <p className=\"tab-content-desc\">상세 목록 데이터가 여기에 표시됩니다.</p>",
  "              </Card>",
  "            </div>",
  "          )}",
  "",
  "          {activeTab === 'history' && (",
  "            <div className=\"fade-in text-secondary\">",
  "              <Card title=\"이력 정보\">",
  "                 <p className=\"tab-content-desc\">변경 이력이 여기에 표시됩니다.</p>",
  "              </Card>",
  "            </div>",
  "          )}",
  "",
  "          {activeTab === 'logs' && (",
  "            <div className=\"fade-in text-secondary\">",
  "              <Card title=\"시스템 로그\">",
  "                 <p className=\"tab-content-desc\">로그 정보가 여기에 표시됩니다.</p>",
  "              </Card>",
  "            </div>",
  "          )}",
  "        </div>",
  "",
  "        <div className=\"mt-6\">",
  "          <SourceCodeViewer code={sourceCode} />",
  "        </div>",
  "      </div>",
  "    </div>",
  "  );",
  "}",
].join('\n');
