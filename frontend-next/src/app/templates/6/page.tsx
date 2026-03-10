'use client';

import React, { useState } from 'react';
import { useModal } from '../../../contexts/ModalContext';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { SelectField, InputField } from '../../../components/common/FormFields';
import { Check } from 'lucide-react';
import './Template6_Wizard.css';

export default function Template6Page() {
  const { showInfo } = useModal();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  return (
    <div className="template-page fade-in p-6">
      <PageHeader 
        title="신규 거래처 등록 (Wizard)" 
        description="복잡한 입력 절차를 여러 스텝으로 분할하여 사용자 실수를 줄입니다."
        breadcrumbs={['템플릿', '마법사(단계별 입력)']}
      />

      <div className="mt-6">
        <Card>
          {/* Step Indicator */}
          <div className="wizard-step-indicator">
            {/* Progress Bar Background */}
            <div className="progress-bar-bg"></div>
            {/* Progress Bar Fill */}
            <div className={`progress-bar-fill step-${step}`}></div>

            <div className="steps-row">
              {[1, 2, 3].map((s) => (
                <div key={s} className="step-item">
                  <div className={`step-circle ${step >= s ? 'active' : ''}`}>
                    {step > s ? <Check size={16} /> : s}
                  </div>
                  <span className={`step-label ${step >= s ? 'active' : ''}`}>
                    {s === 1 ? '기본 정보' : s === 2 ? '계약 정보' : '검토 및 완료'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content by Step */}
          <div className="step-content">
            {step === 1 && (
              <div className="fade-in">
                <h3 className="step-title">1. 거래처 기본 정보 입력</h3>
                <InputField label="사업자 등록번호" placeholder="000-00-00000" />
                <InputField label="상호명(법인명)" placeholder="주식회사 OOO" />
                <InputField label="대표자명" placeholder="홍길동" />
              </div>
            )}
            
            {step === 2 && (
              <div className="fade-in">
                <h3 className="step-title">2. 물류 계약 정보</h3>
                <SelectField label="계약 유형" options={[{ value: 'standard', label: '표준 운송 계약' }, { value: 'premium', label: '프리미엄 3PL 계약' }]} />
                <InputField label="담당 권역" placeholder="예: 수도권, 전국망 등" />
                <InputField label="결제 은행 및 계좌번호" placeholder="은행 선택 및 계좌 입력" />
              </div>
            )}

            {step === 3 && (
              <div className="fade-in success-container">
                <div className="success-icon-wrapper">
                  <Check size={48} />
                </div>
                <h3 className="success-title">모든 정보가 준비되었습니다!</h3>
                <p className="success-description">입력하신 정보를 다시 한번 확인하신 후 [최종 제출]을 클릭해 주세요.</p>
              </div>
            )}
          </div>

          {/* Wizard Controls */}
          <div className="wizard-footer">
            <button className="btn btn-outline" onClick={() => setStep(prev => prev - 1)} disabled={step === 1}>
              이전 단계
            </button>
            
            {step < totalSteps ? (
              <button className="btn btn-primary" onClick={() => setStep(prev => prev + 1)}>다음 단계</button>
            ) : (
              <button className="btn btn-primary btn-success" onClick={() => showInfo({ 
                title: 'common.info', 
                message: 'msg.wizard_complete' 
              })}>
                최종 제출
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
