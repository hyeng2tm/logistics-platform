import React from 'react';
import { useModal } from '../../contexts/ModalContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { InputField, SelectField, ActionButtons } from '../../components/common/FormFields';
import './Template3_CreateEditForm.css';

const Template3_CreateEditForm: React.FC = () => {
  const { showInfo } = useModal();
  return (
    <div className="template-page fade-in">
      <PageHeader 
        title="신규 배송 건 등록" 
        description="새로운 물류 배송 건을 시스템에 등록합니다."
        breadcrumbs={['템플릿', '신규 등록 (Form)']}
      />

      <Card title="배송 정보 입력">
        <form className="form-container">
          <div className="form-grid">
            <InputField 
              label="물품명 *" 
              placeholder="예: 최신형 노트북 10대" 
              className="full-width"
            />
            
            <SelectField 
              label="운송 수단 *" 
              options={[
                { value: 'truck', label: '차량 (Truck)' },
                { value: 'rail', label: '철도 (Rail)' },
                { value: 'ship', label: '선박 (Ship)' },
              ]}
            />
            
            <SelectField 
              label="우선 순위" 
              options={[
                { value: 'normal', label: '일반 (Normal)' },
                { value: 'urgent', label: '긴급 (Urgent)' },
              ]}
            />

            <InputField 
              label="출발지 *" 
              placeholder="출발 센터 / 주소" 
            />

            <InputField 
              label="도착지 *" 
              placeholder="도착 센터 / 주소" 
            />

            <InputField 
              label="특이사항 (선택)" 
              placeholder="취급 주의 등 요청사항" 
              className="full-width"
            />
          </div>

          <div className="form-footer">
            <ActionButtons 
              onCancel={() => showInfo({ 
                title: 'common.info', 
                message: 'msg.action_cancelled' 
              })} 
              onSave={() => showInfo({ 
                title: 'common.info', 
                message: 'msg.action_saved' 
              })} 
              saveText="배송 등록" 
            />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Template3_CreateEditForm;
